package com.cestasdamel.erp.controller;
import com.cestasdamel.erp.dto.Requests.ProductionInput; import com.cestasdamel.erp.dto.Responses.ProductionView; import com.cestasdamel.erp.service.ProductionService; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.ResponseEntity; import org.springframework.security.core.Authentication; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/productions") @RequiredArgsConstructor public class ProductionController {
 private final ProductionService service;
 @GetMapping List<ProductionView> list(){return service.list();}
 @PostMapping ResponseEntity<ProductionView> produce(@Valid @RequestBody ProductionInput input,Authentication auth){return ResponseEntity.status(201).body(service.produce(input,auth.getName()));}
}
