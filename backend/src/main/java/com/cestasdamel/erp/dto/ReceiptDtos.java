package com.cestasdamel.erp.dto;

import com.cestasdamel.erp.model.Enums.ItemType;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ReceiptDtos {
    private ReceiptDtos() {}

    public record ReceiptAnalysis(String establishment,String cnpj,String accessKey,Instant purchasedAt,BigDecimal total,List<ReceiptItemSuggestion> items,List<String> warnings) {}
    public record ReceiptItemSuggestion(int index,String name,String barcode,BigDecimal quantity,UnitOfMeasure inventoryUnit,BigDecimal contentQuantity,UnitOfMeasure contentUnit,BigDecimal unitCost,BigDecimal subtotal,ItemType suggestedType,String categoryName,Long matchedReferenceId,String matchedName,BigDecimal confidence) {}
    public record ReceiptImportLine(@NotNull ItemType type,Long referenceId,@NotBlank String name,String categoryName,@NotNull @Positive BigDecimal quantity,@NotNull UnitOfMeasure unit,@Positive BigDecimal contentQuantity,UnitOfMeasure contentUnit,@NotNull @PositiveOrZero BigDecimal unitCost,@PositiveOrZero BigDecimal salePrice) {}
    public record ReceiptImportConfirmation(@NotBlank String establishment,Instant purchasedAt,String observations,String receiptAccessKey,@NotEmpty List<@Valid ReceiptImportLine> items) {}
}
