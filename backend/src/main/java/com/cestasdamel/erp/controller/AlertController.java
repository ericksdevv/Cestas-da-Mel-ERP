package com.cestasdamel.erp.controller;
import com.cestasdamel.erp.dto.Responses.*; import com.cestasdamel.erp.model.Enums.StockStatus; import com.cestasdamel.erp.service.CatalogService; import lombok.RequiredArgsConstructor; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/alerts") @RequiredArgsConstructor
public class AlertController {private final CatalogService catalog;
 @GetMapping("/stock") Map<String,Object> stock(){List<ProductView> p=catalog.products().stream().filter(x->x.status()!=StockStatus.OK).toList();List<MaterialView> m=catalog.materials().stream().filter(x->x.status()!=StockStatus.OK).toList();return Map.of("products",p,"materials",m,"total",p.size()+m.size());}
}
