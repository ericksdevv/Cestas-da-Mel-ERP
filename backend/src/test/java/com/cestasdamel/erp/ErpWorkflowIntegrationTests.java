package com.cestasdamel.erp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.cestasdamel.erp.dto.Requests.BasketInput;
import com.cestasdamel.erp.dto.Requests.CompositionItem;
import com.cestasdamel.erp.dto.Requests.InventoryAdjustment;
import com.cestasdamel.erp.dto.Requests.MaterialInput;
import com.cestasdamel.erp.dto.Requests.ProductInput;
import com.cestasdamel.erp.dto.Requests.PurchaseInput;
import com.cestasdamel.erp.dto.Requests.PurchaseLine;
import com.cestasdamel.erp.dto.Requests.SaleInput;
import com.cestasdamel.erp.dto.Requests.SaleLine;
import com.cestasdamel.erp.dto.Requests.ProductionInput;
import com.cestasdamel.erp.dto.Responses.BasketView;
import com.cestasdamel.erp.dto.Responses.MaterialView;
import com.cestasdamel.erp.dto.Responses.ProductView;
import com.cestasdamel.erp.dto.Responses.PurchaseView;
import com.cestasdamel.erp.dto.Responses.SaleView;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.model.Enums.ItemType;
import com.cestasdamel.erp.model.Enums.PaymentMethod;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import com.cestasdamel.erp.repository.BasketTemplateRepository;
import com.cestasdamel.erp.repository.ExpenseRepository;
import com.cestasdamel.erp.repository.FinancialTransactionRepository;
import com.cestasdamel.erp.repository.MaterialMovementRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import com.cestasdamel.erp.repository.PurchaseRepository;
import com.cestasdamel.erp.repository.SaleRepository;
import com.cestasdamel.erp.repository.StockMovementRepository;
import com.cestasdamel.erp.repository.BasketMovementRepository;
import com.cestasdamel.erp.repository.ProductionOrderRepository;
import com.cestasdamel.erp.service.CatalogService;
import com.cestasdamel.erp.service.FinanceService;
import com.cestasdamel.erp.service.InventoryService;
import com.cestasdamel.erp.service.OperationsService;
import com.cestasdamel.erp.service.ProductionService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ErpWorkflowIntegrationTests {
    @Autowired CatalogService catalog;
    @Autowired InventoryService inventory;
    @Autowired OperationsService operations;
    @Autowired ProductionService production;
    @Autowired FinanceService finance;
    @Autowired ProductRepository products;
    @Autowired MaterialRepository materials;
    @Autowired BasketTemplateRepository baskets;
    @Autowired SaleRepository sales;
    @Autowired PurchaseRepository purchases;
    @Autowired ExpenseRepository expenses;
    @Autowired FinancialTransactionRepository transactions;
    @Autowired StockMovementRepository stockMovements;
    @Autowired MaterialMovementRepository materialMovements;
    @Autowired BasketMovementRepository basketMovements;
    @Autowired ProductionOrderRepository productionOrders;

    @BeforeEach
    void cleanDatabase() {
        transactions.deleteAll();
        stockMovements.deleteAll();
        materialMovements.deleteAll();
        basketMovements.deleteAll();
        sales.deleteAll();
        productionOrders.deleteAll();
        purchases.deleteAll();
        expenses.deleteAll();
        baskets.deleteAll();
        products.deleteAll();
        materials.deleteAll();
    }

    @Test
    void purchaseAndSaleOfBasketUpdateInventoryAndCashFlow() {
        ProductView product = catalog.saveProduct(null, new ProductInput(
            "Chocolate",
            null,
            null,
            null,
            null,
            BigDecimal.ZERO,
            new BigDecimal("2"),
            new BigDecimal("4"),
            new BigDecimal("8"),
            true
        ));
        MaterialView material = catalog.saveMaterial(null, new MaterialInput(
            "Caixa",
            null,
            null,
            null,
            null,
            UnitOfMeasure.UNIT,
            BigDecimal.ZERO,
            BigDecimal.ONE,
            new BigDecimal("3"),
            true
        ));

        PurchaseView purchase = operations.purchase(new PurchaseInput(
            "Fornecedor",
            null,
            null,
            List.of(
                new PurchaseLine(ItemType.PRODUCT, product.id(), new BigDecimal("10"), null, new BigDecimal("4")),
                new PurchaseLine(ItemType.MATERIAL, material.id(), new BigDecimal("5"), null, new BigDecimal("3"))
            ),
            null
        ));
        assertThat(purchase.total()).isEqualByComparingTo("55.00");

        BasketView basket = catalog.saveBasket(null, new BasketInput(
            "Cesta",
            null,
            new BigDecimal("25"),
            BigDecimal.ZERO,
            true,
            List.of(new CompositionItem(product.id(), new BigDecimal("2"))),
            List.of(new CompositionItem(material.id(), BigDecimal.ONE))
        ));
        production.produce(new ProductionInput(basket.id(), BigDecimal.ONE, null, "montagem teste"), "vinicius");

        SaleView sale = operations.sale(new SaleInput(
            null,
            PaymentMethod.PIX,
            null,
            List.of(
                new SaleLine(ItemType.BASKET, basket.id(), BigDecimal.ONE, null),
                new SaleLine(ItemType.PRODUCT, product.id(), BigDecimal.ONE, null)
            )
        ));

        assertThat(sale.total()).isEqualByComparingTo("33.00");
        assertThat(catalog.products().getFirst().quantity()).isEqualByComparingTo("7.000");
        assertThat(catalog.materials().getFirst().quantity()).isEqualByComparingTo("4.000");
        assertThat(finance.balance()).isEqualByComparingTo("-22.00");
        assertThat(inventory.stockHistory(product.id())).hasSize(3);
        assertThat(inventory.materialHistory(material.id())).hasSize(2);
        assertThat(inventory.basketHistory(basket.id())).hasSize(2);
    }

    @Test
    void insufficientBasketComponentRollsBackEntireSale() {
        ProductView product = catalog.saveProduct(null, new ProductInput(
            "Chocolate",
            null,
            null,
            null,
            null,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ONE,
            BigDecimal.TEN,
            true
        ));
        MaterialView material = catalog.saveMaterial(null, new MaterialInput(
            "Caixa",
            null,
            null,
            null,
            null,
            UnitOfMeasure.UNIT,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ONE,
            true
        ));
        inventory.adjustProduct(product.id(), new InventoryAdjustment(BigDecimal.TEN, null, "inicial"));
        inventory.adjustMaterial(material.id(), new InventoryAdjustment(BigDecimal.ONE, null, "inicial"));

        BasketView basket = catalog.saveBasket(null, new BasketInput(
            "Cesta",
            null,
            BigDecimal.TEN,
            BigDecimal.ZERO,
            true,
            List.of(new CompositionItem(product.id(), BigDecimal.ONE)),
            List.of(new CompositionItem(material.id(), BigDecimal.ONE))
        ));

        assertThatThrownBy(() -> production.produce(new ProductionInput(basket.id(), new BigDecimal("2"), null, null), "vinicius"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Estoque insuficiente");
        assertThat(catalog.products().getFirst().quantity()).isEqualByComparingTo("10.000");
        assertThat(catalog.materials().getFirst().quantity()).isEqualByComparingTo("1.000");
        assertThat(inventory.stockHistory(product.id())).hasSize(1);
        assertThat(inventory.materialHistory(material.id())).hasSize(1);
        assertThat(sales.findAll()).isEmpty();
        assertThat(productionOrders.findAll()).isEmpty();
        assertThat(transactions.findAll()).isEmpty();
    }
}
