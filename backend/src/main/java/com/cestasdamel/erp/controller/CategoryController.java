package com.cestasdamel.erp.controller;

import com.cestasdamel.erp.dto.Requests.CategoryInput;
import com.cestasdamel.erp.dto.Responses.CategoryView;
import com.cestasdamel.erp.model.Enums.CategoryType;
import com.cestasdamel.erp.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    List<CategoryView> list(@RequestParam(required = false) CategoryType type) { return service.list(type); }

    @PostMapping
    ResponseEntity<CategoryView> create(@Valid @RequestBody CategoryInput input) {
        return ResponseEntity.status(201).body(service.save(null, input));
    }

    @PutMapping("/{id}")
    CategoryView update(@PathVariable Long id, @Valid @RequestBody CategoryInput input) { return service.save(id, input); }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@PathVariable Long id) { service.delete(id); return ResponseEntity.noContent().build(); }
}
