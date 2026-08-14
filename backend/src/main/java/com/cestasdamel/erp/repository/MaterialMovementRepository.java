package com.cestasdamel.erp.repository; import com.cestasdamel.erp.model.MaterialMovement; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface MaterialMovementRepository extends JpaRepository<MaterialMovement,Long>{ List<MaterialMovement> findAllByOrderByOccurredAtDesc(); List<MaterialMovement> findByMaterialIdOrderByOccurredAtDesc(Long id); }
