package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant; import java.util.*;
@Entity @Table(name="sales") @Getter @Setter @NoArgsConstructor
public class Sale extends BaseEntity {
 @Column(name="sold_at",nullable=false) private Instant soldAt;
 @Enumerated(EnumType.STRING) @Column(name="payment_method",nullable=false) private Enums.PaymentMethod paymentMethod;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal total;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private Enums.SaleStatus status=Enums.SaleStatus.CONFIRMED;
 private String observations;
 @Column(name="cancelled_at") private Instant cancelledAt;
 @Column(name="cancellation_reason") private String cancellationReason;
 @OneToMany(mappedBy="sale",cascade=CascadeType.ALL,orphanRemoval=true) private List<SaleItem> items=new ArrayList<>();
}
