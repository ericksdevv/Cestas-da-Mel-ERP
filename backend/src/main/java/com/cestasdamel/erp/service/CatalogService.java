package com.cestasdamel.erp.service;

import com.cestasdamel.erp.dto.Requests.BasketInput;
import com.cestasdamel.erp.dto.Requests.CompositionItem;
import com.cestasdamel.erp.dto.Requests.MaterialInput;
import com.cestasdamel.erp.dto.Requests.ProductInput;
import com.cestasdamel.erp.dto.Responses.BasketView;
import com.cestasdamel.erp.dto.Responses.MaterialView;
import com.cestasdamel.erp.dto.Responses.ProductView;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.exception.NotFoundException;
import com.cestasdamel.erp.model.BasketMaterial;
import com.cestasdamel.erp.model.BasketProduct;
import com.cestasdamel.erp.model.BasketTemplate;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import com.cestasdamel.erp.model.Enums.CategoryType;
import com.cestasdamel.erp.model.ItemCategory;
import com.cestasdamel.erp.model.Material;
import com.cestasdamel.erp.model.Product;
import com.cestasdamel.erp.repository.BasketTemplateRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import com.cestasdamel.erp.repository.ItemCategoryRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CatalogService {
    private final ProductRepository products;
    private final MaterialRepository materials;
    private final BasketTemplateRepository baskets;
    private final InventoryService inventory;
    private final UnitConversionService units;
    private final ItemCategoryRepository categories;

    @Transactional(readOnly = true)
    public List<ProductView> products() {
        return products.findAllByDeletedAtIsNullOrderByNameAsc().stream().map(ViewMapper::product).toList();
    }

    @Transactional
    public ProductView saveProduct(Long id, ProductInput input) {
        units.requireValidQuantity(input.quantity(), UnitOfMeasure.UNIT);
        units.requireValidQuantity(input.minimumStock(), UnitOfMeasure.UNIT);
        validateContent(input.contentQuantity(), input.contentUnit());
        boolean created = id == null;
        Product product = created ? new Product() : inventory.lockProduct(id);
        product.setName(input.name().trim());
        product.setDescription(clean(input.description()));
        product.setCategory(resolveCategory(input.categoryId(), CategoryType.PRODUCT));
        product.setUnit(UnitOfMeasure.UNIT);
        product.setContentQuantity(input.contentQuantity());
        product.setContentUnit(input.contentUnit());
        product.setMinimumStock(input.minimumStock());
        product.setPurchasePrice(input.purchasePrice());
        product.setSalePrice(input.salePrice());
        if (input.active() != null) product.setActive(input.active());
        products.saveAndFlush(product);
        inventory.setProductQuantity(product, input.quantity(), created
            ? "Estoque inicial informado no cadastro"
            : "Estoque atualizado no cadastro");
        return ViewMapper.product(product);
    }

    @Transactional
    public ProductView saveProductImage(Long id, MultipartFile file) {
        Product product = inventory.lockProduct(id);
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Selecione uma imagem para o produto");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new BusinessException("A imagem deve ter no máximo 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !Set.of("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new BusinessException("Use uma imagem JPG, PNG ou WEBP");
        }
        try {
            byte[] bytes = file.getBytes();
            if (!isSupportedImage(bytes, contentType)) {
                throw new BusinessException("O arquivo selecionado não é uma imagem válida");
            }
            product.setImageContentType(contentType);
            product.setImageData(bytes);
            products.saveAndFlush(product);
            return ViewMapper.product(product);
        } catch (java.io.IOException exception) {
            throw new BusinessException("Não foi possível salvar a imagem");
        }
    }

    @Transactional(readOnly = true)
    public ProductImage productImage(Long id) {
        Product product = products.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new NotFoundException("Produto", id));
        if (product.getImageData() == null || product.getImageData().length == 0) {
            throw new NotFoundException("Imagem do produto", id);
        }
        return new ProductImage(product.getImageContentType(), product.getImageData());
    }

    @Transactional
    public void deleteProductImage(Long id) {
        Product product = inventory.lockProduct(id);
        product.setImageContentType(null);
        product.setImageData(null);
        products.saveAndFlush(product);
    }

    @Transactional(readOnly = true)
    public List<MaterialView> materials() {
        return materials.findAllByDeletedAtIsNullOrderByNameAsc().stream().map(ViewMapper::material).toList();
    }

    @Transactional
    public MaterialView saveMaterial(Long id, MaterialInput input) {
        units.requireValidQuantity(input.quantity(), input.unit());
        units.requireValidQuantity(input.minimumStock(), input.unit());
        validateMaterialContent(input.contentQuantity(), input.contentUnit());
        boolean created = id == null;
        Material material = created ? new Material() : inventory.lockMaterial(id);
        material.setName(input.name().trim());
        material.setDescription(clean(input.description()));
        material.setCategory(resolveCategory(input.categoryId(), CategoryType.MATERIAL));
        material.setContentQuantity(input.contentQuantity());
        material.setContentUnit(input.contentUnit());
        material.setUnit(input.unit());
        material.setMinimumStock(input.minimumStock());
        material.setUnitCost(input.unitCost());
        if (input.active() != null) material.setActive(input.active());
        materials.saveAndFlush(material);
        inventory.setMaterialQuantity(material, input.quantity(), created
            ? "Estoque inicial informado no cadastro"
            : "Estoque atualizado no cadastro");
        return ViewMapper.material(material);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = inventory.lockProduct(id);
        if (baskets.isProductUsed(id)) {
            throw new BusinessException("Remova este produto das cestas antes de excluí-lo");
        }
        product.setActive(false);
        product.setDeletedAt(Instant.now());
    }

    @Transactional
    public void deleteMaterial(Long id) {
        Material material = inventory.lockMaterial(id);
        if (baskets.isMaterialUsed(id)) {
            throw new BusinessException("Remova este material das cestas antes de excluí-lo");
        }
        material.setActive(false);
        material.setDeletedAt(Instant.now());
    }

    @Transactional
    public void deleteBasket(Long id) {
        BasketTemplate basket = inventory.lockBasket(id);
        basket.setActive(false);
        basket.setDeletedAt(Instant.now());
    }

    @Transactional(readOnly = true)
    public List<BasketView> baskets() {
        return baskets.findAllDetailed().stream()
            .map(basket -> ViewMapper.basket(basket, maximumProducible(basket)))
            .toList();
    }

    @Transactional(readOnly = true)
    public BasketView basket(Long id) {
        BasketTemplate basket = baskets.findDetailed(id).orElseThrow(() -> new NotFoundException("Cesta", id));
        return ViewMapper.basket(basket, maximumProducible(basket));
    }

    @Transactional
    public BasketView saveBasket(Long id, BasketInput input) {
        if (input.products().isEmpty() && input.materials().isEmpty()) {
            throw new BusinessException("Adicione ao menos um produto ou material à cesta");
        }

        BigDecimal minimumStock = input.minimumStock() == null ? BigDecimal.ZERO : input.minimumStock();
        units.requireValidQuantity(minimumStock, UnitOfMeasure.UNIT);
        BasketTemplate basket = id == null
            ? new BasketTemplate()
            : baskets.findDetailed(id).orElseThrow(() -> new NotFoundException("Cesta", id));

        basket.setName(input.name().trim());
        basket.setDescription(clean(input.description()));
        basket.setSalePrice(input.salePrice());
        basket.setMinimumStock(minimumStock);
        if (input.active() != null) basket.setActive(input.active());

        basket.getProducts().clear();
        basket.getMaterials().clear();
        if (id != null) baskets.flush();

        Set<Long> seenProducts = new HashSet<>();
        for (CompositionItem entry : input.products()) {
            if (!seenProducts.add(entry.id())) {
                throw new BusinessException("Produto repetido na composição: " + entry.id());
            }
            Product product = products.findByIdAndDeletedAtIsNull(entry.id())
                .orElseThrow(() -> new NotFoundException("Produto", entry.id()));
            if (!product.isActive()) throw new BusinessException("Produto inativo: " + product.getName());
            units.requireValidQuantity(entry.quantity(), product.getUnit());
            BasketProduct component = new BasketProduct();
            component.setBasket(basket);
            component.setProduct(product);
            component.setQuantity(entry.quantity());
            basket.getProducts().add(component);
        }

        Set<Long> seenMaterials = new HashSet<>();
        for (CompositionItem entry : input.materials()) {
            if (!seenMaterials.add(entry.id())) {
                throw new BusinessException("Material repetido na composição: " + entry.id());
            }
            Material material = materials.findByIdAndDeletedAtIsNull(entry.id())
                .orElseThrow(() -> new NotFoundException("Material", entry.id()));
            if (!material.isActive()) throw new BusinessException("Material inativo: " + material.getName());
            units.requireValidQuantity(entry.quantity(), material.getUnit());
            BasketMaterial component = new BasketMaterial();
            component.setBasket(basket);
            component.setMaterial(material);
            component.setQuantity(entry.quantity());
            basket.getMaterials().add(component);
        }

        BasketTemplate saved = baskets.save(basket);
        return ViewMapper.basket(saved, maximumProducible(saved));
    }

    public BigDecimal maximumProducible(BasketTemplate basket) {
        List<BigDecimal> limits = new ArrayList<>();
        basket.getProducts().forEach(component -> limits.add(component.getProduct().getQuantity()
            .divide(component.getQuantity(), 0, RoundingMode.DOWN)));
        basket.getMaterials().forEach(component -> limits.add(component.getMaterial().getQuantity()
            .divide(component.getQuantity(), 0, RoundingMode.DOWN)));
        return limits.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
    }

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ItemCategory resolveCategory(Long id, CategoryType expectedType) {
        if (id == null) return null;
        ItemCategory category = categories.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new NotFoundException("Categoria", id));
        if (category.getType() != expectedType) {
            throw new BusinessException("A categoria selecionada não pertence a este tipo de cadastro");
        }
        return category;
    }

    private void validateContent(BigDecimal quantity, UnitOfMeasure unit) {
        if (quantity == null && unit == null) return;
        if (quantity == null || unit == null) {
            throw new BusinessException("Informe o conteúdo e a unidade da embalagem");
        }
        if (!Set.of(UnitOfMeasure.G, UnitOfMeasure.KG, UnitOfMeasure.ML, UnitOfMeasure.L).contains(unit)) {
            throw new BusinessException("O conteúdo do produto deve ser informado em g, kg, ml ou L");
        }
    }

    private void validateMaterialContent(BigDecimal quantity, UnitOfMeasure unit) {
        if (quantity == null && unit == null) return;
        if (quantity == null || unit == null) {
            throw new BusinessException("Informe a medida e a unidade do material");
        }
        if (!Set.of(UnitOfMeasure.G, UnitOfMeasure.KG, UnitOfMeasure.ML, UnitOfMeasure.L, UnitOfMeasure.M, UnitOfMeasure.CM).contains(unit)) {
            throw new BusinessException("A medida do material deve ser informada em g, kg, ml, L, m ou cm");
        }
    }

    private boolean isSupportedImage(byte[] bytes, String contentType) {
        if (bytes.length < 12) return false;
        if ("image/jpeg".equals(contentType)) return (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8;
        if ("image/png".equals(contentType)) return (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47;
        return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
            && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }

    public record ProductImage(String contentType, byte[] data) {}
}
