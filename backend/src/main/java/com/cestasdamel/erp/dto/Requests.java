package com.cestasdamel.erp.dto;
import com.cestasdamel.erp.model.Enums.*; import jakarta.validation.Valid; import jakarta.validation.constraints.*; import java.math.BigDecimal; import java.time.Instant; import java.util.List;
public final class Requests { private Requests(){}
 public record Register(@NotBlank String name,@Email @NotBlank String email,@Size(min=6) String password){}
 public record Login(@Email @NotBlank String email,@NotBlank String password){}
 public record ProductInput(@NotBlank String name,String description,@NotNull UnitOfMeasure unit,@PositiveOrZero BigDecimal minimumStock,@PositiveOrZero BigDecimal purchasePrice,@PositiveOrZero BigDecimal salePrice,Boolean active){}
 public record MaterialInput(@NotBlank String name,String description,@NotNull UnitOfMeasure unit,@PositiveOrZero BigDecimal minimumStock,@PositiveOrZero BigDecimal unitCost,Boolean active){}
 public record CompositionItem(@NotNull Long id,@NotNull @Positive BigDecimal quantity){}
 public record BasketInput(@NotBlank String name,String description,@NotNull @PositiveOrZero BigDecimal salePrice,Boolean active,@NotNull List<@Valid CompositionItem> products,@NotNull List<@Valid CompositionItem> materials){}
 public record Assembly(@NotNull @Positive Integer quantity,String notes){}
 public record InventoryAdjustment(@NotNull BigDecimal quantity,@NotBlank String notes){}
 public record SaleLine(@NotNull ItemType type,@NotNull Long referenceId,@NotNull @Positive BigDecimal quantity,@PositiveOrZero BigDecimal unitPrice){}
 public record SaleInput(Instant soldAt,@NotNull PaymentMethod paymentMethod,String observations,@NotEmpty List<@Valid SaleLine> items){}
 public record PurchaseLine(@NotNull ItemType type,@NotNull Long referenceId,@NotNull @Positive BigDecimal quantity,@NotNull @PositiveOrZero BigDecimal unitCost){}
 public record PurchaseInput(@NotBlank String establishment,Instant purchasedAt,String observations,@NotEmpty List<@Valid PurchaseLine> items){}
 public record ExpenseInput(@NotBlank String description,@NotBlank String category,Instant occurredAt,@NotNull @Positive BigDecimal amount,String observations){}
 public record ManualTransaction(@NotNull TransactionType type,@NotBlank String description,@NotNull @Positive BigDecimal amount,Instant occurredAt){}
}
