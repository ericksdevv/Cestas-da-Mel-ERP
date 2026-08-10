package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant;
@Entity @Table(name="financial_transactions") @Getter @Setter @NoArgsConstructor
public class FinancialTransaction extends BaseEntity {
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.TransactionType type;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.TransactionSource source;
 @Column(name="reference_id") private Long referenceId;
 @Column(nullable=false) private String description;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal amount;
 @Column(name="occurred_at",nullable=false) private Instant occurredAt;
}
