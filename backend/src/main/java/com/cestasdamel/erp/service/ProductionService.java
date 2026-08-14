package com.cestasdamel.erp.service;
import com.cestasdamel.erp.dto.Requests.ProductionInput; import com.cestasdamel.erp.dto.Responses.ProductionView; import com.cestasdamel.erp.exception.BusinessException; import com.cestasdamel.erp.model.*; import com.cestasdamel.erp.repository.ProductionOrderRepository; import lombok.RequiredArgsConstructor; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional; import java.math.*; import java.time.Instant; import java.util.*;
@Service @RequiredArgsConstructor public class ProductionService {
 private final ProductionOrderRepository orders; private final InventoryService inventory;
 @Transactional public ProductionView produce(ProductionInput r,String responsible){
  if(r.quantity().stripTrailingZeros().scale()>0)throw new BusinessException("Quantidade produzida deve ser inteira");
  BasketTemplate basket=inventory.lockBasket(r.basketId()); if(!basket.isActive())throw new BusinessException("Cesta inativa: "+basket.getName()); if(basket.getProducts().isEmpty()&&basket.getMaterials().isEmpty())throw new BusinessException("A cesta não possui componentes");
  Instant at=r.producedAt()==null?Instant.now():r.producedAt(); BigDecimal unitCost=calculateCost(basket);
  ProductionOrder order=new ProductionOrder();order.setBasket(basket);order.setQuantity(r.quantity());order.setUnitCost(unitCost);order.setProducedAt(at);order.setResponsible(responsible);order.setNotes(r.notes());orders.save(order);
  String notes="Produção da cesta "+basket.getName();
  basket.getProducts().stream().sorted(Comparator.comparing(x->x.getProduct().getId())).forEach(c->{Product p=inventory.lockProduct(c.getProduct().getId());if(!p.isActive())throw new BusinessException("Produto inativo na cesta: "+p.getName());inventory.remove(p,c.getQuantity().multiply(r.quantity()),Enums.MovementReason.BASKET_PRODUCTION,order.getId(),notes,at);});
  basket.getMaterials().stream().sorted(Comparator.comparing(x->x.getMaterial().getId())).forEach(c->{Material m=inventory.lockMaterial(c.getMaterial().getId());if(!m.isActive())throw new BusinessException("Material inativo na cesta: "+m.getName());inventory.remove(m,c.getQuantity().multiply(r.quantity()),Enums.MovementReason.BASKET_PRODUCTION,order.getId(),notes,at);});
  inventory.add(basket,r.quantity(),Enums.MovementReason.BASKET_PRODUCTION,order.getId(),notes,at); return ViewMapper.production(order);
 }
 private BigDecimal calculateCost(BasketTemplate b){BigDecimal value=BigDecimal.ZERO;for(BasketProduct c:b.getProducts())value=value.add(c.getProduct().getPurchasePrice().multiply(c.getQuantity()));for(BasketMaterial c:b.getMaterials())value=value.add(c.getMaterial().getUnitCost().multiply(c.getQuantity()));return value.setScale(2,RoundingMode.HALF_UP);}
 @Transactional(readOnly=true) public List<ProductionView> list(){return orders.findAllByOrderByProducedAtDesc().stream().map(ViewMapper::production).toList();}
}
