package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name="sale_items") @Getter @Setter @NoArgsConstructor
public class SaleItem extends BaseEntity {
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Sale sale;
 @Enumerated(EnumType.STRING) @Column(name="item_type",nullable=false) private Enums.ItemType itemType;
 @Column(name="reference_id",nullable=false) private Long referenceId;
 @Column(name="item_name",nullable=false) private String itemName;
 @Column(nullable=false,precision=15,scale=3) private BigDecimal quantity;
 @Column(name="unit_price",nullable=false,precision=15,scale=2) private BigDecimal unitPrice;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal subtotal;
}
