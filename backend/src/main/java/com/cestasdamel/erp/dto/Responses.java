package com.cestasdamel.erp.dto;
import com.cestasdamel.erp.model.Enums.*; import java.math.BigDecimal; import java.time.Instant; import java.time.LocalDate; import java.util.List;
public final class Responses { private Responses(){}
 public record Auth(String token,String tokenType,long expiresIn,String username){}
 public record UserView(Long id,String name,String username,UserRole role,boolean active){}
 public record CategoryView(Long id,String name,CategoryType type){}
 public record ProductView(Long id,String name,String description,CategoryView category,UnitOfMeasure unit,BigDecimal quantity,BigDecimal minimumStock,BigDecimal purchasePrice,BigDecimal salePrice,boolean active,StockStatus status,BigDecimal contentQuantity,UnitOfMeasure contentUnit,boolean hasImage,Long imageVersion){}
 public record MaterialView(Long id,String name,String description,CategoryView category,UnitOfMeasure unit,BigDecimal quantity,BigDecimal minimumStock,BigDecimal unitCost,boolean active,StockStatus status,BigDecimal contentQuantity,UnitOfMeasure contentUnit){}
 public record ComponentView(Long id,String name,BigDecimal quantity,UnitOfMeasure unit){}
 public record BasketView(Long id,String name,String description,BigDecimal salePrice,BigDecimal quantity,BigDecimal minimumStock,boolean active,StockStatus status,BigDecimal maximumProducible,List<ComponentView> products,List<ComponentView> materials){}
 public record ItemView(Long id,ItemType type,Long referenceId,String name,BigDecimal quantity,BigDecimal unitValue,BigDecimal subtotal){}
 public record SaleView(Long id,Instant soldAt,PaymentMethod paymentMethod,BigDecimal total,SaleStatus status,String observations,Instant cancelledAt,String cancellationReason,List<ItemView> items){}
 public record ProductionView(Long id,Long basketId,String basketName,BigDecimal quantity,BigDecimal unitCost,BigDecimal totalCost,Instant producedAt,String responsible,String notes,ProductionStatus status){}
 public record PurchaseView(Long id,String establishment,Instant purchasedAt,BigDecimal total,String observations,List<ItemView> items,String receiptAccessKey){}
 public record ExpenseView(Long id,String description,String category,Instant occurredAt,BigDecimal amount,String observations){}
 public record FinancialView(Long id,TransactionType type,TransactionSource source,Long referenceId,String description,BigDecimal amount,Instant occurredAt){}
 public record MovementView(Long id,Long itemId,String itemName,UnitOfMeasure unit,MovementType type,MovementReason reason,BigDecimal quantity,BigDecimal balanceAfter,Long referenceId,String notes,Instant occurredAt){}
 public record Dashboard(BigDecimal cashBalance,BigDecimal salesToday,BigDecimal salesWeek,BigDecimal salesMonth,BigDecimal expensesToday,BigDecimal expensesWeek,BigDecimal expensesMonth,BigDecimal purchasesToday,BigDecimal purchasesWeek,BigDecimal purchasesMonth,long salesCountToday,long salesCountWeek,long salesCountMonth,long productsLow,long productsOut,long materialsLow,long materialsOut,List<FinancialView> recentTransactions){}
 public record MonthlySummary(int year,int month,BigDecimal sales,BigDecimal purchases,BigDecimal expenses,BigDecimal netCash){}
 public record CashPoint(LocalDate date,BigDecimal income,BigDecimal expense,BigDecimal balance){}
 public record CashFlowReport(ReportPeriod period,LocalDate from,LocalDate to,BigDecimal income,BigDecimal expense,BigDecimal balance,List<CashPoint> points){}
}
