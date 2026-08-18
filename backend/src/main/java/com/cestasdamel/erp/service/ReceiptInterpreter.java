package com.cestasdamel.erp.service;

import com.cestasdamel.erp.model.Enums.ItemType;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ReceiptInterpreter {
    RawReceipt analyze(MultipartFile image);
    record RawReceipt(String establishment,String cnpj,String accessKey,String purchasedAt,BigDecimal total,List<RawItem> items,List<String> warnings) {}
    record RawItem(String name,String barcode,BigDecimal quantity,UnitOfMeasure inventoryUnit,BigDecimal contentQuantity,UnitOfMeasure contentUnit,BigDecimal unitCost,BigDecimal subtotal,ItemType suggestedType,String categoryName,BigDecimal confidence) {}
}
