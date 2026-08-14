package com.cestasdamel.erp.service;

import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class UnitConversionService {
    public BigDecimal convert(BigDecimal quantity, UnitOfMeasure from, UnitOfMeasure to) {
        UnitOfMeasure source = from == null ? to : from;
        requireValidQuantity(quantity, source);
        if (source == to) return quantity;
        if (!dimension(source).equals(dimension(to))) {
            throw new BusinessException("Unidades incompatíveis: " + source + " e " + to);
        }
        return quantity.multiply(factor(source)).divide(factor(to));
    }

    public void requireValidQuantity(BigDecimal quantity, UnitOfMeasure unit) {
        if (quantity != null && isCountable(unit) && quantity.stripTrailingZeros().scale() > 0) {
            throw new BusinessException("A unidade selecionada aceita apenas quantidades inteiras");
        }
    }

    private boolean isCountable(UnitOfMeasure unit) {
        return unit == UnitOfMeasure.UNIT || unit == UnitOfMeasure.PACKAGE || unit == UnitOfMeasure.BOX;
    }

    private String dimension(UnitOfMeasure unit) {
        return switch (unit) {
            case G, KG -> "MASS";
            case ML, L -> "VOLUME";
            case CM, M -> "LENGTH";
            case UNIT -> "UNIT";
            case PACKAGE -> "PACKAGE";
            case BOX -> "BOX";
        };
    }

    private BigDecimal factor(UnitOfMeasure unit) {
        return switch (unit) {
            case KG, L -> new BigDecimal("1000");
            case M -> new BigDecimal("100");
            default -> BigDecimal.ONE;
        };
    }
}
