package com.cestasdamel.erp.controller;

import com.cestasdamel.erp.dto.ReceiptDtos.ReceiptAnalysis;
import com.cestasdamel.erp.dto.ReceiptDtos.ReceiptImportConfirmation;
import com.cestasdamel.erp.dto.Responses.PurchaseView;
import com.cestasdamel.erp.service.ReceiptImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/receipt-imports")
@RequiredArgsConstructor
public class ReceiptImportController {
    private final ReceiptImportService service;

    @PostMapping(value="/analyze",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    ReceiptAnalysis analyze(@RequestPart("file") MultipartFile file){return service.analyze(file);}

    @PostMapping("/confirm")
    ResponseEntity<PurchaseView> confirm(@Valid @RequestBody ReceiptImportConfirmation input){return ResponseEntity.status(HttpStatus.CREATED).body(service.confirm(input));}
}
