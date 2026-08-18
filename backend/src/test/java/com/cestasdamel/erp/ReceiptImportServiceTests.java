package com.cestasdamel.erp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.cestasdamel.erp.dto.ReceiptDtos.ReceiptAnalysis;
import com.cestasdamel.erp.dto.ReceiptDtos.ReceiptImportConfirmation;
import com.cestasdamel.erp.dto.ReceiptDtos.ReceiptImportLine;
import com.cestasdamel.erp.exception.BusinessException;
import com.cestasdamel.erp.model.Enums.ItemType;
import com.cestasdamel.erp.model.Enums.UnitOfMeasure;
import com.cestasdamel.erp.repository.FinancialTransactionRepository;
import com.cestasdamel.erp.repository.ItemCategoryRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import com.cestasdamel.erp.service.ReceiptImportService;
import com.cestasdamel.erp.service.ReceiptInterpreter;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReceiptImportServiceTests {
    @MockBean ReceiptInterpreter interpreter;
    @Autowired ReceiptImportService service;
    @Autowired ProductRepository products;
    @Autowired ItemCategoryRepository categories;
    @Autowired FinancialTransactionRepository transactions;

    @Test
    void analyzesConfirmsAndBlocksDuplicateReceipt(){
        when(interpreter.analyze(any())).thenReturn(new ReceiptInterpreter.RawReceipt(
            "Perfumaria Central","12345678000190","35260812345678000190550010000012341000012345","2026-08-15",new BigDecimal("79.80"),
            List.of(new ReceiptInterpreter.RawItem("Perfume Floral 100 ml","7891234567890",new BigDecimal("2"),UnitOfMeasure.UNIT,new BigDecimal("100"),UnitOfMeasure.ML,new BigDecimal("39.90"),new BigDecimal("79.80"),ItemType.PRODUCT,"Perfumaria",new BigDecimal("0.96"))),List.of()
        ));
        ReceiptAnalysis analysis=service.analyze(new MockMultipartFile("file","nota.jpg","image/jpeg",new byte[]{1,2,3}));
        assertThat(analysis.items()).hasSize(1);
        assertThat(analysis.items().getFirst().contentQuantity()).isEqualByComparingTo("100");

        ReceiptImportConfirmation confirmation=new ReceiptImportConfirmation(analysis.establishment(),analysis.purchasedAt(),"Importação de teste",analysis.accessKey(),List.of(
            new ReceiptImportLine(ItemType.PRODUCT,null,"Perfume Floral 100 ml","Perfumaria",new BigDecimal("2"),UnitOfMeasure.UNIT,new BigDecimal("100"),UnitOfMeasure.ML,new BigDecimal("39.90"),new BigDecimal("69.90"))
        ));
        var purchase=service.confirm(confirmation);
        assertThat(purchase.total()).isEqualByComparingTo("79.80");
        assertThat(products.findFirstByNameIgnoreCaseAndDeletedAtIsNull("Perfume Floral 100 ml").orElseThrow().getQuantity()).isEqualByComparingTo("2");
        assertThat(categories.existsByTypeAndNameIgnoreCaseAndDeletedAtIsNull(com.cestasdamel.erp.model.Enums.CategoryType.PRODUCT,"Perfumaria")).isTrue();
        assertThat(transactions.findAll()).anyMatch(item->item.getReferenceId().equals(purchase.id())&&item.getAmount().compareTo(new BigDecimal("79.80"))==0);
        assertThatThrownBy(()->service.confirm(confirmation)).isInstanceOf(BusinessException.class).hasMessageContaining("já foi importada");
    }
}
