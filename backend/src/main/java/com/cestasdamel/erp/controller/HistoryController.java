package com.cestasdamel.erp.controller;

import com.cestasdamel.erp.model.Enums.HistoryType;
import com.cestasdamel.erp.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class HistoryController {
    private final HistoryService history;

    @DeleteMapping("/{type}")
    ResponseEntity<Void> clear(@PathVariable HistoryType type) {
        history.clear(type);
        return ResponseEntity.noContent().build();
    }
}
