package com.cestasdamel.erp.dto;
import com.cestasdamel.erp.model.Enums.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.math.BigDecimal; import java.time.Instant; import java.util.List;
public final class Requests { private Requests(){}
 public record Login(@NotBlank String username,@NotBlank String password){}
 public record Register(@NotBlank String name,@NotBlank @Size(min=3,max=120) String username,@NotBlank @Size(min=6,max=100) String password){}
 public record CategoryInput(@NotBlank String name,@NotNull CategoryType type){}
 public record ProductInput(@NotBlank String name,String description,Long categoryId,@Positive BigDecimal contentQuantity,UnitOfMeasure contentUnit,@NotNull @PositiveOrZero BigDecimal quantity,@NotNull @PositiveOrZero BigDecimal minimumStock,@NotNull @PositiveOrZero BigDecimal purchasePrice,@NotNull @PositiveOrZero BigDecimal salePrice,Boolean active){}
 public record MaterialInput(@NotBlank String name,String description,Long categoryId,@Positive BigDecimal contentQuantity,UnitOfMeasure contentUnit,@NotNull UnitOfMeasure unit,@NotNull @PositiveOrZero BigDecimal quantity,@NotNull @PositiveOrZero BigDecimal minimumStock,@NotNull @PositiveOrZero BigDecimal unitCost,Boolean active){}
 public record CompositionItem(@NotNull Long id,@NotNull @Positive BigDecimal quantity){}
 public record BasketInput(@NotBlank String name,String description,@NotNull @PositiveOrZero BigDecimal salePrice,@PositiveOrZero BigDecimal minimumStock,Boolean active,@NotNull List<@Valid CompositionItem> products,@NotNull List<@Valid CompositionItem> materials){}
 public record InventoryAdjustment(@NotNull BigDecimal quantity,UnitOfMeasure unit,@NotBlank String notes){}
 public record ProductionInput(@NotNull Long basketId,@NotNull @Positive BigDecimal quantity,Instant producedAt,String notes){}
 public record CancellationInput(@NotBlank String reason){}
 public record SaleLine(@NotNull ItemType type,@NotNull Long referenceId,@NotNull @Positive BigDecimal quantity,@PositiveOrZero BigDecimal unitPrice){}
 public record SaleInput(Instant soldAt,@NotNull PaymentMethod paymentMethod,String observations,@NotEmpty List<@Valid SaleLine> items){}
 public record PurchaseLine(@NotNull ItemType type,@NotNull Long referenceId,@NotNull @Positive BigDecimal quantity,UnitOfMeasure unit,@NotNull @PositiveOrZero BigDecimal unitCost){}
 public record PurchaseInput(@NotBlank String establishment,Instant purchasedAt,String observations,@NotEmpty List<@Valid PurchaseLine> items,String receiptAccessKey){public PurchaseInput(String establishment,Instant purchasedAt,String observations,List<PurchaseLine> items){this(establishment,purchasedAt,observations,items,null);}}
 public record ExpenseInput(@NotBlank String description,@NotBlank String category,Instant occurredAt,@NotNull @Positive BigDecimal amount,String observations){}
 public record ManualTransaction(@NotNull TransactionType type,@NotBlank String description,@NotNull @Positive BigDecimal amount,Instant occurredAt){}
}
