package com.cestasdamel.erp.repository;

import com.cestasdamel.erp.model.Enums.CategoryType;
import com.cestasdamel.erp.model.ItemCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemCategoryRepository extends JpaRepository<ItemCategory, Long> {
    List<ItemCategory> findAllByDeletedAtIsNullOrderByTypeAscNameAsc();
    List<ItemCategory> findAllByTypeAndDeletedAtIsNullOrderByNameAsc(CategoryType type);
    Optional<ItemCategory> findByIdAndDeletedAtIsNull(Long id);
    Optional<ItemCategory> findFirstByTypeAndNameIgnoreCaseAndDeletedAtIsNull(CategoryType type, String name);
    boolean existsByTypeAndNameIgnoreCaseAndDeletedAtIsNull(CategoryType type, String name);
}
