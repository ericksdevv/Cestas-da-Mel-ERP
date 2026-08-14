package com.cestasdamel.erp.repository;
import com.cestasdamel.erp.model.BasketMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BasketMovementRepository extends JpaRepository<BasketMovement,Long> {
    List<BasketMovement> findAllByOrderByOccurredAtDesc();
    List<BasketMovement> findByBasketIdOrderByOccurredAtDesc(Long basketId);
}
