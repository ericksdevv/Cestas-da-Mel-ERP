package com.cestasdamel.erp.service;

import com.cestasdamel.erp.model.BaseEntity;
import com.cestasdamel.erp.model.Enums.HistoryType;
import com.cestasdamel.erp.model.HistoryClearance;
import com.cestasdamel.erp.repository.HistoryClearanceRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HistoryService {
    private final HistoryClearanceRepository clearances;

    @Transactional
    public void clear(HistoryType type) {
        HistoryClearance clearance = clearances.findByHistoryType(type).orElseGet(() -> {
            HistoryClearance created = new HistoryClearance();
            created.setHistoryType(type);
            return created;
        });
        clearance.setClearedAt(Instant.now());
        clearances.saveAndFlush(clearance);
    }

    @Transactional(readOnly = true)
    public Instant cutoff(HistoryType type) {
        return clearances.findByHistoryType(type)
            .map(HistoryClearance::getClearedAt)
            .orElse(Instant.EPOCH);
    }

    public boolean visibleAfter(BaseEntity entity, Instant cutoff) {
        return entity.getCreatedAt() != null && entity.getCreatedAt().isAfter(cutoff);
    }
}
