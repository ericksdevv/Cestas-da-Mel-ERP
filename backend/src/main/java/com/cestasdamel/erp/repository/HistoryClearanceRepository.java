package com.cestasdamel.erp.repository;

import com.cestasdamel.erp.model.Enums.HistoryType;
import com.cestasdamel.erp.model.HistoryClearance;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoryClearanceRepository extends JpaRepository<HistoryClearance, Long> {
    Optional<HistoryClearance> findByHistoryType(HistoryType historyType);
}
