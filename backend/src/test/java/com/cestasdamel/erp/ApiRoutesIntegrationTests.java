package com.cestasdamel.erp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import com.cestasdamel.erp.repository.BasketMovementRepository;
import com.cestasdamel.erp.repository.BasketTemplateRepository;
import com.cestasdamel.erp.repository.ExpenseRepository;
import com.cestasdamel.erp.repository.FinancialTransactionRepository;
import com.cestasdamel.erp.repository.ItemCategoryRepository;
import com.cestasdamel.erp.repository.MaterialMovementRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import com.cestasdamel.erp.repository.ProductionOrderRepository;
import com.cestasdamel.erp.repository.PurchaseRepository;
import com.cestasdamel.erp.repository.SaleRepository;
import com.cestasdamel.erp.repository.StockMovementRepository;
import com.cestasdamel.erp.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiRoutesIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired FinancialTransactionRepository transactions;
    @Autowired StockMovementRepository stockMovements;
    @Autowired MaterialMovementRepository materialMovements;
    @Autowired BasketMovementRepository basketMovements;
    @Autowired SaleRepository sales;
    @Autowired ProductionOrderRepository productions;
    @Autowired PurchaseRepository purchases;
    @Autowired ExpenseRepository expenses;
    @Autowired BasketTemplateRepository baskets;
    @Autowired ProductRepository products;
    @Autowired MaterialRepository materials;
    @Autowired ItemCategoryRepository categories;

    @BeforeEach
    void cleanDatabase() {
        transactions.deleteAll();
        stockMovements.deleteAll();
        materialMovements.deleteAll();
        basketMovements.deleteAll();
        sales.deleteAll();
        productions.deleteAll();
        purchases.deleteAll();
        expenses.deleteAll();
        baskets.deleteAll();
        products.deleteAll();
        materials.deleteAll();
        categories.deleteAll();
        users.deleteAll();
    }

    @Test
    void everyPublicRouteCompletesTheErpWorkflow() throws Exception {
        mockMvc.perform(get("/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));

        perform(post("/auth/register"), null, """
            {"name":"Vinicius","username":"vinicius","password":"admin123"}
            """, 201);
        String token = json(perform(post("/auth/login"), null, """
            {"username":"vinicius","password":"admin123"}
            """, 200)).get("token").asText();
        perform(post("/auth/register"), token, """
            {"name":"Gestor","username":"gestor","password":"senha123"}
            """, 201);

        long productCategoryId = json(perform(post("/categories"), token, """
            {"name":"Alimentos","type":"PRODUCT"}
            """, 201)).get("id").asLong();
        long materialCategoryId = json(perform(post("/categories"), token, """
            {"name":"Embalagens","type":"MATERIAL"}
            """, 201)).get("id").asLong();
        perform(get("/categories?type=PRODUCT"), token, null, 200);
        perform(get("/categories?type=MATERIAL"), token, null, 200);

        long productId = json(perform(post("/products"), token, String.format("""
            {"name":"Chocolate","description":"Ao leite","categoryId":%d,"contentQuantity":90,"contentUnit":"G","quantity":10,"minimumStock":2,"purchasePrice":4,"salePrice":8,"active":true}
            """, productCategoryId), 201)).get("id").asLong();
        perform(put("/products/" + productId), token, String.format("""
            {"name":"Chocolate 90g","description":"Ao leite","categoryId":%d,"contentQuantity":90,"contentUnit":"G","quantity":10,"minimumStock":2,"purchasePrice":4,"salePrice":8,"active":true}
            """, productCategoryId), 200);
        MockMultipartFile image = new MockMultipartFile("file", "produto.png", "image/png",
            new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0});
        mockMvc.perform(multipart("/products/" + productId + "/image").file(image)
                .with(request -> { request.setMethod("PUT"); return request; })
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.hasImage").value(true));
        mockMvc.perform(get("/products/" + productId + "/image")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(content().contentType("image/png"));
        perform(post("/products/" + productId + "/adjust-stock"), token, """
            {"quantity":-1,"unit":"UNIT","notes":"Conferência física"}
            """, 200);

        long materialId = json(perform(post("/materials"), token, String.format("""
            {"name":"Fita","description":"Fita decorativa","categoryId":%d,"contentQuantity":5,"contentUnit":"M","unit":"M","quantity":5,"minimumStock":1,"unitCost":2,"active":true}
            """, materialCategoryId), 201)).get("id").asLong();
        perform(put("/materials/" + materialId), token, String.format("""
            {"name":"Fita neon","description":"Fita decorativa","categoryId":%d,"contentQuantity":5,"contentUnit":"M","unit":"M","quantity":5,"minimumStock":1,"unitCost":2,"active":true}
            """, materialCategoryId), 200);
        perform(post("/materials/" + materialId + "/adjust-stock"), token, """
            {"quantity":50,"unit":"CM","notes":"Entrada avulsa"}
            """, 200);

        long basketId = json(perform(post("/baskets"), token, String.format("""
            {"name":"Cesta Neon","description":"Presente","salePrice":25,"minimumStock":0,"active":true,
             "products":[{"id":%d,"quantity":2}],"materials":[{"id":%d,"quantity":0.5}]}
            """, productId, materialId), 201)).get("id").asLong();
        perform(get("/baskets/" + basketId), token, null, 200);
        perform(put("/baskets/" + basketId), token, String.format("""
            {"name":"Cesta Neon","description":"Presente especial","salePrice":25,"minimumStock":0,"active":true,
             "products":[{"id":%d,"quantity":2}],"materials":[{"id":%d,"quantity":0.5}]}
            """, productId, materialId), 200);
        perform(post("/productions"), token, String.format("""
            {"basketId":%d,"quantity":2,"notes":"Lote de teste"}
            """, basketId), 201);

        long saleId = json(perform(post("/sales"), token, String.format("""
            {"paymentMethod":"PIX","observations":"Venda de teste","items":[
              {"type":"BASKET","referenceId":%d,"quantity":1},
              {"type":"PRODUCT","referenceId":%d,"quantity":1}]}
            """, basketId, productId), 201)).get("id").asLong();
        perform(get("/sales"), token, null, 200);

        perform(post("/purchases"), token, String.format("""
            {"establishment":"Fornecedor","items":[{"type":"PRODUCT","referenceId":%d,"quantity":2,"unit":"UNIT","unitCost":4}]}
            """, productId), 201);
        perform(get("/purchases"), token, null, 200);
        perform(post("/expenses"), token, """
            {"description":"Entrega","category":"Logística","amount":10}
            """, 201);
        perform(get("/expenses"), token, null, 200);
        perform(post("/financial-transactions"), token, """
            {"type":"INCOME","description":"Capital inicial","amount":100}
            """, 200);

        perform(get("/products"), token, null, 200);
        perform(get("/materials"), token, null, 200);
        perform(get("/baskets"), token, null, 200);
        perform(get("/productions"), token, null, 200);
        perform(get("/alerts/stock"), token, null, 200);
        perform(get("/stock-movements?productId=" + productId), token, null, 200);
        perform(get("/material-movements?materialId=" + materialId), token, null, 200);
        perform(get("/basket-movements?basketId=" + basketId), token, null, 200);
        perform(get("/financial-transactions"), token, null, 200);
        perform(get("/financial-transactions/balance"), token, null, 200);
        perform(get("/dashboard"), token, null, 200);
        LocalDate today = LocalDate.now();
        perform(get("/reports/monthly?year=" + today.getYear() + "&month=" + today.getMonthValue()), token, null, 200);
        perform(get("/reports/cash-flow?period=DAILY&referenceDate=" + today), token, null, 200);
        perform(get("/reports/cash-flow?period=WEEKLY&referenceDate=" + today), token, null, 200);
        perform(get("/reports/cash-flow?period=MONTHLY&referenceDate=" + today), token, null, 200);

        perform(post("/sales/" + saleId + "/cancel"), token, """
            {"reason":"Pedido cancelado pelo cliente"}
            """, 200);
        perform(delete("/products/" + productId + "/image"), token, null, 204);
        perform(delete("/baskets/" + basketId), token, null, 204);
        perform(delete("/products/" + productId), token, null, 204);
        perform(delete("/materials/" + materialId), token, null, 204);
        perform(delete("/categories/" + productCategoryId), token, null, 204);
        perform(delete("/categories/" + materialCategoryId), token, null, 204);
        mockMvc.perform(get("/products").header("Authorization", "Bearer " + token)).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/materials").header("Authorization", "Bearer " + token)).andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/baskets").header("Authorization", "Bearer " + token)).andExpect(jsonPath("$.length()").value(0));
    }

    private String perform(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                           String token, String body, int expectedStatus) throws Exception {
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.contentType(MediaType.APPLICATION_JSON).content(body);
        return mockMvc.perform(request)
            .andExpect(status().is(expectedStatus))
            .andReturn()
            .getResponse()
            .getContentAsString();
    }

    private JsonNode json(String value) throws Exception {
        return mapper.readTree(value);
    }
}
