package com.cestasdamel.erp.service;

import com.cestasdamel.erp.dto.Requests.CategoryInput;
import com.cestasdamel.erp.dto.Responses.CategoryView;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.exception.NotFoundException;
import com.cestasdamel.erp.model.Enums.CategoryType;
import com.cestasdamel.erp.model.ItemCategory;
import com.cestasdamel.erp.repository.ItemCategoryRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final ItemCategoryRepository categories;
    private final ProductRepository products;
    private final MaterialRepository materials;

    @Transactional(readOnly = true)
    public List<CategoryView> list(CategoryType type) {
        var result = type == null
            ? categories.findAllByDeletedAtIsNullOrderByTypeAscNameAsc()
            : categories.findAllByTypeAndDeletedAtIsNullOrderByNameAsc(type);
        return result.stream().map(ViewMapper::category).toList();
    }

    @Transactional
    public CategoryView save(Long id, CategoryInput input) {
        String name = input.name().trim();
        ItemCategory category = id == null ? new ItemCategory() : find(id);
        boolean changedIdentity = id == null || category.getType() != input.type() || !category.getName().equalsIgnoreCase(name);
        if (changedIdentity && categories.existsByTypeAndNameIgnoreCaseAndDeletedAtIsNull(input.type(), name)) {
            throw new BusinessException("Já existe uma categoria com este nome");
        }
        if (id != null && category.getType() != input.type() && isUsed(category)) {
            throw new BusinessException("Não é possível mudar o tipo de uma categoria em uso");
        }
        category.setName(name);
        category.setType(input.type());
        category.setActive(true);
        return ViewMapper.category(categories.save(category));
    }

    @Transactional
    public void delete(Long id) {
        ItemCategory category = find(id);
        if (isUsed(category)) {
            throw new BusinessException("Retire esta categoria dos cadastros antes de excluí-la");
        }
        category.setActive(false);
        category.setDeletedAt(Instant.now());
    }

    private ItemCategory find(Long id) {
        return categories.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new NotFoundException("Categoria", id));
    }

    private boolean isUsed(ItemCategory category) {
        return category.getType() == CategoryType.PRODUCT
            ? products.existsByCategoryIdAndDeletedAtIsNull(category.getId())
            : materials.existsByCategoryIdAndDeletedAtIsNull(category.getId());
    }
}
