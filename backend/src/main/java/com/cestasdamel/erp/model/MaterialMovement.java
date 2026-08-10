package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant;
@Entity @Table(name="material_movements") @Getter @Setter @NoArgsConstructor
public class MaterialMovement extends BaseEntity {
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Material material;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.MovementType type;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.MovementReason reason;
 @Column(nullable=false,precision=15,scale=3) private BigDecimal quantity;
 @Column(name="balance_after",nullable=false,precision=15,scale=3) private BigDecimal balanceAfter;
 @Column(name="reference_id") private Long referenceId;
 private String notes;
 @Column(name="occurred_at",nullable=false) private Instant occurredAt;
}
