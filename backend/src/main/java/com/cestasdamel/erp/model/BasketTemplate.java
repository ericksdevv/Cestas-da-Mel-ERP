package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant; import java.util.*;
@Entity @Table(name="basket_templates") @Getter @Setter @NoArgsConstructor
public class BasketTemplate extends BaseEntity {
 @Column(nullable=false) private String name; private String description;
 @Column(name="sale_price",nullable=false,precision=15,scale=2) private BigDecimal salePrice=BigDecimal.ZERO;
 @Column(name="stock_quantity",nullable=false,precision=15,scale=3) private BigDecimal stockQuantity=BigDecimal.ZERO;
 @Column(name="minimum_stock",nullable=false,precision=15,scale=3) private BigDecimal minimumStock=BigDecimal.ZERO;
 @Column(nullable=false) private boolean active=true;
 @Column(name="deleted_at") private Instant deletedAt;
 @OneToMany(mappedBy="basket",cascade=CascadeType.ALL,orphanRemoval=true) private Set<BasketProduct> products=new LinkedHashSet<>();
 @OneToMany(mappedBy="basket",cascade=CascadeType.ALL,orphanRemoval=true) private Set<BasketMaterial> materials=new LinkedHashSet<>();
}
