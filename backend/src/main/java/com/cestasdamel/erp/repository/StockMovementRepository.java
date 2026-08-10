package com.cestasdamel.erp.repository; import com.cestasdamel.erp.model.StockMovement; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface StockMovementRepository extends JpaRepository<StockMovement,Long>{ List<StockMovement> findAllByOrderByOccurredAtDesc(); List<StockMovement> findByProductIdOrderByOccurredAtDesc(Long id); }
