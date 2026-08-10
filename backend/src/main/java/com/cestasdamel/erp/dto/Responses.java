package com.cestasdamel.erp.dto;
import com.cestasdamel.erp.model.Enums.*; import java.math.BigDecimal; import java.time.Instant; import java.util.List;
public final class Responses { private Responses(){}
 public record Auth(String token,String tokenType,long expiresInSeconds,UserView user){}
 public record UserView(Long id,String name,String email,boolean active){}
 public record ProductView(Long id,String name,String description,UnitOfMeasure unit,BigDecimal quantity,BigDecimal minimumStock,BigDecimal purchasePrice,BigDecimal salePrice,boolean active,StockStatus status){}
 public record MaterialView(Long id,String name,String description,UnitOfMeasure unit,BigDecimal quantity,BigDecimal minimumStock,BigDecimal unitCost,boolean active,StockStatus status){}
 public record ComponentView(Long id,String name,BigDecimal quantity,UnitOfMeasure unit){}
 public record BasketView(Long id,String name,String description,BigDecimal salePrice,int assembledQuantity,boolean active,List<ComponentView> products,List<ComponentView> materials){}
 public record ItemView(Long id,ItemType type,Long referenceId,String name,BigDecimal quantity,BigDecimal unitValue,BigDecimal subtotal){}
 public record SaleView(Long id,Instant soldAt,PaymentMethod paymentMethod,BigDecimal total,String observations,List<ItemView> items){}
 public record PurchaseView(Long id,String establishment,Instant purchasedAt,BigDecimal total,String observations,List<ItemView> items){}
 public record ExpenseView(Long id,String description,String category,Instant occurredAt,BigDecimal amount,String observations){}
 public record FinancialView(Long id,TransactionType type,TransactionSource source,Long referenceId,String description,BigDecimal amount,Instant occurredAt){}
 public record MovementView(Long id,Long itemId,String itemName,MovementType type,MovementReason reason,BigDecimal quantity,BigDecimal balanceAfter,Long referenceId,String notes,Instant occurredAt){}
 public record Dashboard(BigDecimal cashBalance,BigDecimal salesToday,BigDecimal salesMonth,BigDecimal expensesToday,BigDecimal expensesMonth,BigDecimal purchasesMonth,long salesCountToday,long productsLow,long productsOut,long materialsLow,long materialsOut,int assembledBaskets,List<FinancialView> recentTransactions){}
 public record MonthlySummary(int year,int month,BigDecimal sales,BigDecimal purchases,BigDecimal expenses,BigDecimal netCash){}
}
