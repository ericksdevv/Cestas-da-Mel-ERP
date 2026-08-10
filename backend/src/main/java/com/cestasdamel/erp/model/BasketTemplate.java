package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.util.*;
@Entity @Table(name="basket_templates") @Getter @Setter @NoArgsConstructor
public class BasketTemplate extends BaseEntity {
 @Column(nullable=false) private String name; private String description;
 @Column(name="sale_price",nullable=false,precision=15,scale=2) private BigDecimal salePrice=BigDecimal.ZERO;
 @Column(name="assembled_quantity",nullable=false) private int assembledQuantity;
 @Column(nullable=false) private boolean active=true;
 @OneToMany(mappedBy="basket",cascade=CascadeType.ALL,orphanRemoval=true) private Set<BasketProduct> products=new LinkedHashSet<>();
 @OneToMany(mappedBy="basket",cascade=CascadeType.ALL,orphanRemoval=true) private Set<BasketMaterial> materials=new LinkedHashSet<>();
}
