package com.cestasdamel.erp.controller;
import com.cestasdamel.erp.dto.Requests.*; import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.service.*; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequiredArgsConstructor public class InventoryController {private final InventoryService inventory;private final OperationsService operations;
 @PostMapping("/products/{id}/adjust-stock") ProductView product(@PathVariable Long id,@Valid @RequestBody InventoryAdjustment r){return inventory.adjustProduct(id,r);}@PostMapping("/materials/{id}/adjust-stock") MaterialView material(@PathVariable Long id,@Valid @RequestBody InventoryAdjustment r){return inventory.adjustMaterial(id,r);}
 @PostMapping("/baskets/{id}/assemble") BasketView assemble(@PathVariable Long id,@Valid @RequestBody Assembly r){return operations.assemble(id,r);}
 @GetMapping("/stock-movements") List<MovementView> stocks(@RequestParam(required=false) Long productId){return inventory.stockHistory(productId);}@GetMapping("/material-movements") List<MovementView> materials(@RequestParam(required=false) Long materialId){return inventory.materialHistory(materialId);}
}
