package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name="products") @Getter @Setter @NoArgsConstructor
public class Product extends BaseEntity {
 @Column(nullable=false) private String name;
 private String description;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.UnitOfMeasure unit;
 @Column(nullable=false,precision=15,scale=3) private BigDecimal quantity=BigDecimal.ZERO;
 @Column(name="minimum_stock",nullable=false,precision=15,scale=3) private BigDecimal minimumStock=BigDecimal.ZERO;
 @Column(name="purchase_price",nullable=false,precision=15,scale=2) private BigDecimal purchasePrice=BigDecimal.ZERO;
 @Column(name="sale_price",nullable=false,precision=15,scale=2) private BigDecimal salePrice=BigDecimal.ZERO;
 @Column(nullable=false) private boolean active=true;
}
