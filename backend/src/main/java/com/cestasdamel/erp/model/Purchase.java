package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.Instant; import java.util.*;
@Entity @Table(name="purchases") @Getter @Setter @NoArgsConstructor
public class Purchase extends BaseEntity {
 @Column(nullable=false) private String establishment;
 @Column(name="purchased_at",nullable=false) private Instant purchasedAt;
 @Column(nullable=false,precision=15,scale=2) private BigDecimal total;
 private String observations;
 @OneToMany(mappedBy="purchase",cascade=CascadeType.ALL,orphanRemoval=true) private List<PurchaseItem> items=new ArrayList<>();
}
