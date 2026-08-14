package com.cestasdamel.erp.controller;

import com.cestasdamel.erp.dto.Responses.CashFlowReport;
import com.cestasdamel.erp.dto.Responses.Dashboard;
import com.cestasdamel.erp.dto.Responses.MonthlySummary;
import com.cestasdamel.erp.model.Enums.ReportPeriod;
import com.cestasdamel.erp.service.ReportingService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReportingController {
    private final ReportingService service;

    @GetMapping("/dashboard") Dashboard dashboard() { return service.dashboard(); }
    @GetMapping("/reports/monthly") MonthlySummary monthly(@RequestParam int year, @RequestParam int month) { return service.monthly(year, month); }
    @GetMapping("/reports/cash-flow") CashFlowReport cashFlow(
        @RequestParam ReportPeriod period,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate referenceDate
    ) { return service.cashFlow(period, referenceDate); }
}
