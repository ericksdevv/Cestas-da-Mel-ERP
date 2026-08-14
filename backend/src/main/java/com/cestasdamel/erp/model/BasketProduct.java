package com.cestasdamel.erp.model;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal;
@Entity @Table(name="basket_products",uniqueConstraints=@UniqueConstraint(columnNames={"basket_id","product_id"})) @Getter @Setter @NoArgsConstructor
public class BasketProduct extends BaseEntity {
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="basket_id") private BasketTemplate basket;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) private Product product;
 @Column(nullable=false,precision=15,scale=3) private BigDecimal quantity;
}
