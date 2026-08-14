package com.cestasdamel.erp.controller;

import java.time.Instant;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    Map<String, Object> health() {
        jdbcTemplate.queryForObject("select 1", Integer.class);
        return Map.of(
            "status", "UP",
            "database", "UP",
            "timestamp", Instant.now()
        );
    }
}
