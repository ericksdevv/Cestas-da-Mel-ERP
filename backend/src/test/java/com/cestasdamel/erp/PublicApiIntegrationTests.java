package com.cestasdamel.erp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import com.cestasdamel.erp.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicApiIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository users;

    @BeforeEach
    void cleanUsers() {
        users.deleteAll();
    }

    @Test
    void productsEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/products"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void validLoginReturnsTokenThatAuthorizesApiAccess() throws Exception {
        String token = login();

        mockMvc.perform(get("/products").header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void invalidLoginIsRejected() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"vinicius","password":"senha-errada"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Usuário ou senha inválidos"));
    }

    @Test
    void malformedJsonReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/products")
                .header("Authorization", "Bearer " + login())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{invalid-json"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void onlyAuthenticatedAdminCanRegisterAfterBootstrap() throws Exception {
        login();

        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Outro","username":"outro","password":"senha-segura"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    private String login() throws Exception {
        mockMvc.perform(post("/auth/setup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Vinicius","username":"vinicius","password":"admin123"}
                    """))
            .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"username":"vinicius","password":"admin123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.username").value("vinicius"))
            .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
