package com.cestasdamel.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "history_clearances")
@Getter
@Setter
@NoArgsConstructor
public class HistoryClearance extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @Column(name = "history_type", nullable = false, unique = true, length = 40)
    private Enums.HistoryType historyType;

    @Column(name = "cleared_at", nullable = false)
    private Instant clearedAt;
}
