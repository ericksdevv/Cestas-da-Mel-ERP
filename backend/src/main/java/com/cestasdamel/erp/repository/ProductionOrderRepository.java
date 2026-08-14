package com.cestasdamel.erp.repository;
import com.cestasdamel.erp.model.ProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder,Long> { List<ProductionOrder> findAllByOrderByProducedAtDesc(); }
