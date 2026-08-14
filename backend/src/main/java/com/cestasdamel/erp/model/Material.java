package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant;
@Entity @Table(name="materials") @Getter @Setter @NoArgsConstructor
public class Material extends BaseEntity {
 @Column(nullable=false) private String name; private String description;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="category_id") private ItemCategory category;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.UnitOfMeasure unit;
 @Column(nullable=false,precision=15,scale=3) private BigDecimal quantity=BigDecimal.ZERO;
 @Column(name="minimum_stock",nullable=false,precision=15,scale=3) private BigDecimal minimumStock=BigDecimal.ZERO;
 @Column(name="content_quantity",precision=15,scale=3) private BigDecimal contentQuantity;
 @Enumerated(EnumType.STRING) @Column(name="content_unit") private Enums.UnitOfMeasure contentUnit;
 @Column(name="unit_cost",nullable=false,precision=15,scale=2) private BigDecimal unitCost=BigDecimal.ZERO;
 @Column(nullable=false) private boolean active=true;
 @Column(name="deleted_at") private Instant deletedAt;
}
