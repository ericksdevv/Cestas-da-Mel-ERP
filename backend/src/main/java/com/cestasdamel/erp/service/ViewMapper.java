package com.cestasdamel.erp.service;
import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.model.*; import static com.cestasdamel.erp.model.Enums.StockStatus.*; import java.math.BigDecimal;
public final class ViewMapper { private ViewMapper(){}
 public static Enums.StockStatus status(BigDecimal q,BigDecimal min){return q.signum()<=0?OUT_OF_STOCK:(q.compareTo(min)<=0?LOW:OK);}
 public static ProductView product(Product p){return new ProductView(p.getId(),p.getName(),p.getDescription(),p.getUnit(),p.getQuantity(),p.getMinimumStock(),p.getPurchasePrice(),p.getSalePrice(),p.isActive(),status(p.getQuantity(),p.getMinimumStock()));}
 public static MaterialView material(Material m){return new MaterialView(m.getId(),m.getName(),m.getDescription(),m.getUnit(),m.getQuantity(),m.getMinimumStock(),m.getUnitCost(),m.isActive(),status(m.getQuantity(),m.getMinimumStock()));}
 public static BasketView basket(BasketTemplate b){return new BasketView(b.getId(),b.getName(),b.getDescription(),b.getSalePrice(),b.getAssembledQuantity(),b.isActive(),b.getProducts().stream().map(x->new ComponentView(x.getProduct().getId(),x.getProduct().getName(),x.getQuantity(),x.getProduct().getUnit())).toList(),b.getMaterials().stream().map(x->new ComponentView(x.getMaterial().getId(),x.getMaterial().getName(),x.getQuantity(),x.getMaterial().getUnit())).toList());}
 public static SaleView sale(Sale s){return new SaleView(s.getId(),s.getSoldAt(),s.getPaymentMethod(),s.getTotal(),s.getObservations(),s.getItems().stream().map(x->new ItemView(x.getId(),x.getItemType(),x.getReferenceId(),x.getItemName(),x.getQuantity(),x.getUnitPrice(),x.getSubtotal())).toList());}
 public static PurchaseView purchase(Purchase p){return new PurchaseView(p.getId(),p.getEstablishment(),p.getPurchasedAt(),p.getTotal(),p.getObservations(),p.getItems().stream().map(x->new ItemView(x.getId(),x.getItemType(),x.getReferenceId(),x.getItemName(),x.getQuantity(),x.getUnitCost(),x.getSubtotal())).toList());}
 public static ExpenseView expense(Expense e){return new ExpenseView(e.getId(),e.getDescription(),e.getCategory(),e.getOccurredAt(),e.getAmount(),e.getObservations());}
 public static FinancialView financial(FinancialTransaction f){return new FinancialView(f.getId(),f.getType(),f.getSource(),f.getReferenceId(),f.getDescription(),f.getAmount(),f.getOccurredAt());}
}
