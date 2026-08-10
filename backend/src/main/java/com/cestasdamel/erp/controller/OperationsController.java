package com.cestasdamel.erp.controller;
import com.cestasdamel.erp.dto.Requests.*; import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.service.OperationsService; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequiredArgsConstructor public class OperationsController {private final OperationsService service;
 @PostMapping("/sales") ResponseEntity<SaleView> sale(@Valid @RequestBody SaleInput r){return ResponseEntity.status(201).body(service.sale(r));}@GetMapping("/sales") List<SaleView> sales(){return service.sales();}
 @PostMapping("/purchases") ResponseEntity<PurchaseView> purchase(@Valid @RequestBody PurchaseInput r){return ResponseEntity.status(201).body(service.purchase(r));}@GetMapping("/purchases") List<PurchaseView> purchases(){return service.purchases();}
 @PostMapping("/expenses") ResponseEntity<ExpenseView> expense(@Valid @RequestBody ExpenseInput r){return ResponseEntity.status(201).body(service.expense(r));}@GetMapping("/expenses") List<ExpenseView> expenses(){return service.expenses();}
}
