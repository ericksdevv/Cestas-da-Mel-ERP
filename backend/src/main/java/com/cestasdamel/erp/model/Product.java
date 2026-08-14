package com.cestasdamel.erp.model;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product extends BaseEntity {
    @Column(nullable = false)
    private String name;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ItemCategory category;

    /** Produtos acabados são sempre controlados por unidade. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.UnitOfMeasure unit = Enums.UnitOfMeasure.UNIT;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "minimum_stock", nullable = false, precision = 15, scale = 3)
    private BigDecimal minimumStock = BigDecimal.ZERO;

    /** Peso ou volume informado na embalagem, sem relação com o saldo do estoque. */
    @Column(name = "content_quantity", precision = 15, scale = 3)
    private BigDecimal contentQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_unit")
    private Enums.UnitOfMeasure contentUnit;

    @Column(name = "purchase_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "sale_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal salePrice = BigDecimal.ZERO;

    @Column(name = "image_content_type", length = 60)
    private String imageContentType;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_data")
    private byte[] imageData;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
