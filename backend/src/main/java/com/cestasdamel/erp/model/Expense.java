package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant;
@Entity @Table(name="expenses") @Getter @Setter @NoArgsConstructor
public class Expense extends BaseEntity {
 @Column(nullable=false) private String description;
 @Column(nullable=false) private String category;
 @Column(name="occurred_at",nullable=false) private Instant occurredAt;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal amount;
 private String observations;
}
