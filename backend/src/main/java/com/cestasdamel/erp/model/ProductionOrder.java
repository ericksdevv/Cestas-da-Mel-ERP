package com.cestasdamel.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "production_orders")
@Getter @Setter @NoArgsConstructor
public class ProductionOrder extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "basket_id") private BasketTemplate basket;
    @Column(nullable = false, precision = 15, scale = 3) private BigDecimal quantity;
    @Column(name = "unit_cost", nullable = false, precision = 15, scale = 2) private BigDecimal unitCost;
    @Column(name = "produced_at", nullable = false) private Instant producedAt;
    @Column(nullable = false) private String responsible;
    private String notes;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Enums.ProductionStatus status = Enums.ProductionStatus.COMPLETED;
}
