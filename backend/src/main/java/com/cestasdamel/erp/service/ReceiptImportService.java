package com.cestasdamel.erp.service;

import com.cestasdamel.erp.dto.ReceiptDtos.*;
import com.cestasdamel.erp.dto.Requests.PurchaseInput;
import com.cestasdamel.erp.dto.Requests.PurchaseLine;
import com.cestasdamel.erp.dto.Responses.PurchaseView;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.exception.NotFoundException;
import com.cestasdamel.erp.model.Enums.CategoryType;
import com.cestasdamel.erp.model.Enums.ItemType;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import com.cestasdamel.erp.model.ItemCategory;
import com.cestasdamel.erp.model.Material;
import com.cestasdamel.erp.model.Product;
import com.cestasdamel.erp.repository.ItemCategoryRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ReceiptImportService {
    private final ReceiptInterpreter interpreter;
    private final ProductRepository products;
    private final MaterialRepository materials;
    private final ItemCategoryRepository categories;
    private final OperationsService operations;
    @Value("${app.business-zone:America/Fortaleza}") private String businessZone;

    @Transactional(readOnly=true)
    public ReceiptAnalysis analyze(MultipartFile image){
        ReceiptInterpreter.RawReceipt raw=interpreter.analyze(image);
        if(raw.items()==null||raw.items().isEmpty())throw new BusinessException("Nenhum item foi encontrado na nota");
        List<Product> productCatalog=products.findAllByDeletedAtIsNullOrderByNameAsc();
        List<Material> materialCatalog=materials.findAllByDeletedAtIsNullOrderByNameAsc();
        List<String> warnings=new ArrayList<>(raw.warnings()==null?List.of():raw.warnings());
        List<ReceiptItemSuggestion> items=new ArrayList<>();
        for(int index=0;index<raw.items().size();index++){
            ReceiptInterpreter.RawItem item=raw.items().get(index);
            ItemType type=item.suggestedType()==ItemType.MATERIAL?ItemType.MATERIAL:ItemType.PRODUCT;
            Match match=type==ItemType.PRODUCT?bestProduct(item.name(),productCatalog):bestMaterial(item.name(),materialCatalog);
            BigDecimal quantity=positiveOr(item.quantity(),BigDecimal.ONE);
            BigDecimal unitCost=nonNegative(item.unitCost());
            BigDecimal subtotal=nonNegative(item.subtotal());
            if(subtotal.signum()==0&&unitCost.signum()>0)subtotal=quantity.multiply(unitCost);
            if(item.confidence()==null||item.confidence().compareTo(new BigDecimal("0.70"))<0)warnings.add("Revise o item "+(index+1)+": "+safeName(item.name()));
            items.add(new ReceiptItemSuggestion(index,safeName(item.name()),cleanDigits(item.barcode()),quantity,item.inventoryUnit()==null?UnitOfMeasure.UNIT:item.inventoryUnit(),item.contentQuantity(),item.contentUnit(),unitCost,subtotal,type,blankTo(item.categoryName(),"Outros"),match.id(),match.name(),boundedConfidence(item.confidence())));
        }
        return new ReceiptAnalysis(blankTo(raw.establishment(),"Estabelecimento não identificado"),cleanDigits(raw.cnpj()),cleanDigits(raw.accessKey()),parseDate(raw.purchasedAt()),nonNegative(raw.total()),items,warnings.stream().distinct().toList());
    }

    @Transactional
    public PurchaseView confirm(ReceiptImportConfirmation input){
        List<PurchaseLine> lines=new ArrayList<>();
        for(ReceiptImportLine line:input.items()){
            if(line.type()!=ItemType.PRODUCT&&line.type()!=ItemType.MATERIAL)throw new BusinessException("A nota aceita apenas produtos e materiais");
            validateContent(line);
            Long referenceId=line.referenceId();
            UnitOfMeasure purchaseUnit=line.unit();
            if(referenceId==null){
                if(line.type()==ItemType.PRODUCT){
                    Product product=createProduct(line);
                    referenceId=product.getId(); purchaseUnit=UnitOfMeasure.UNIT;
                }else{
                    Material material=createMaterial(line);
                    referenceId=material.getId(); purchaseUnit=material.getUnit();
                }
            }else if(line.type()==ItemType.PRODUCT){
                Product product=products.findByIdAndDeletedAtIsNull(referenceId).orElseThrow(()->new NotFoundException("Produto",line.referenceId()));
                purchaseUnit=product.getUnit();
            }else{
                Material material=materials.findByIdAndDeletedAtIsNull(referenceId).orElseThrow(()->new NotFoundException("Material",line.referenceId()));
                purchaseUnit=line.unit();
            }
            lines.add(new PurchaseLine(line.type(),referenceId,line.quantity(),purchaseUnit,line.unitCost()));
        }
        return operations.purchase(new PurchaseInput(input.establishment().trim(),input.purchasedAt(),input.observations(),lines,input.receiptAccessKey()));
    }

    private Product createProduct(ReceiptImportLine line){
        if(line.quantity().stripTrailingZeros().scale()>0)throw new BusinessException("A quantidade de produtos deve ser inteira");
        Product product=new Product(); product.setName(line.name().trim()); product.setDescription("Cadastrado a partir de nota fiscal");
        product.setCategory(category(CategoryType.PRODUCT,line.categoryName())); product.setUnit(UnitOfMeasure.UNIT); product.setQuantity(BigDecimal.ZERO); product.setMinimumStock(BigDecimal.ZERO);
        product.setContentQuantity(line.contentQuantity()); product.setContentUnit(line.contentUnit()); product.setPurchasePrice(line.unitCost()); product.setSalePrice(line.salePrice()==null?BigDecimal.ZERO:line.salePrice()); product.setActive(true);
        return products.save(product);
    }

    private Material createMaterial(ReceiptImportLine line){
        Material material=new Material(); material.setName(line.name().trim()); material.setDescription("Cadastrado a partir de nota fiscal");
        material.setCategory(category(CategoryType.MATERIAL,line.categoryName())); material.setUnit(line.unit()); material.setQuantity(BigDecimal.ZERO); material.setMinimumStock(BigDecimal.ZERO);
        material.setContentQuantity(line.contentQuantity()); material.setContentUnit(line.contentUnit()); material.setUnitCost(line.unitCost()); material.setActive(true);
        return materials.save(material);
    }

    private ItemCategory category(CategoryType type,String name){
        String categoryName=blankTo(name,"Outros").trim();
        return categories.findFirstByTypeAndNameIgnoreCaseAndDeletedAtIsNull(type,categoryName).orElseGet(()->{ItemCategory value=new ItemCategory();value.setName(categoryName);value.setType(type);value.setActive(true);return categories.save(value);});
    }

    private void validateContent(ReceiptImportLine line){
        if((line.contentQuantity()==null)!=(line.contentUnit()==null))throw new BusinessException("Informe o conteúdo e a unidade da embalagem juntos");
        if(line.type()==ItemType.PRODUCT&&line.unit()!=UnitOfMeasure.UNIT)throw new BusinessException("Produtos acabados devem entrar no estoque por unidade");
        if(line.type()==ItemType.PRODUCT&&line.quantity().stripTrailingZeros().scale()>0)throw new BusinessException("A quantidade de produtos deve ser inteira");
    }

    private Match bestProduct(String name,List<Product> catalog){return catalog.stream().map(item->new Match(item.getId(),item.getName(),similarity(name,item.getName()))).filter(item->item.score()>=0.67).max(java.util.Comparator.comparingDouble(Match::score)).orElse(Match.NONE);}
    private Match bestMaterial(String name,List<Material> catalog){return catalog.stream().map(item->new Match(item.getId(),item.getName(),similarity(name,item.getName()))).filter(item->item.score()>=0.67).max(java.util.Comparator.comparingDouble(Match::score)).orElse(Match.NONE);}
    private double similarity(String left,String right){Set<String> a=tokens(left),b=tokens(right);if(a.isEmpty()||b.isEmpty())return 0;Set<String> intersection=new HashSet<>(a);intersection.retainAll(b);Set<String> union=new HashSet<>(a);union.addAll(b);double score=(double)intersection.size()/union.size();if(normalize(left).equals(normalize(right)))return 1;return score;}
    private Set<String> tokens(String value){return new HashSet<>(Arrays.asList(normalize(value).split("\\s+")));}
    private String normalize(String value){if(value==null)return "";return Normalizer.normalize(value,Normalizer.Form.NFD).replaceAll("\\p{M}","").replaceAll("[^a-zA-Z0-9 ]"," ").toLowerCase(Locale.ROOT).trim().replaceAll("\\s+"," ");}
    private Instant parseDate(String value){if(value==null||value.isBlank())return Instant.now();try{return Instant.parse(value);}catch(Exception ignored){try{return LocalDate.parse(value.substring(0,10)).atStartOfDay(ZoneId.of(businessZone)).toInstant();}catch(Exception invalid){return Instant.now();}}}
    private String cleanDigits(String value){if(value==null)return null;String digits=value.replaceAll("\\D","");return digits.isBlank()?null:digits;}
    private String blankTo(String value,String fallback){return value==null||value.isBlank()?fallback:value.trim();}
    private String safeName(String value){return blankTo(value,"Item não identificado");}
    private BigDecimal positiveOr(BigDecimal value,BigDecimal fallback){return value==null||value.signum()<=0?fallback:value;}
    private BigDecimal nonNegative(BigDecimal value){return value==null||value.signum()<0?BigDecimal.ZERO:value;}
    private BigDecimal boundedConfidence(BigDecimal value){if(value==null)return BigDecimal.ZERO;return value.max(BigDecimal.ZERO).min(BigDecimal.ONE);}
    private record Match(Long id,String name,double score){private static final Match NONE=new Match(null,null,0);}
}
