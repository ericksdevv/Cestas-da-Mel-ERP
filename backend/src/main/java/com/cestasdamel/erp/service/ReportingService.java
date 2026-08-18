package com.cestasdamel.erp.service;

import com.cestasdamel.erp.dto.Responses.CashFlowReport;
import com.cestasdamel.erp.dto.Responses.CashPoint;
import com.cestasdamel.erp.dto.Responses.Dashboard;
import com.cestasdamel.erp.dto.Responses.MonthlySummary;
import com.cestasdamel.erp.model.Enums.ReportPeriod;
import com.cestasdamel.erp.model.Enums.StockStatus;
import com.cestasdamel.erp.model.Enums.TransactionType;
import com.cestasdamel.erp.repository.ExpenseRepository;
import com.cestasdamel.erp.repository.FinancialTransactionRepository;
import com.cestasdamel.erp.repository.MaterialRepository;
import com.cestasdamel.erp.repository.ProductRepository;
import com.cestasdamel.erp.repository.PurchaseRepository;
import com.cestasdamel.erp.repository.SaleRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportingService {
    private final SaleRepository sales;
    private final PurchaseRepository purchases;
    private final ExpenseRepository expenses;
    private final ProductRepository products;
    private final MaterialRepository materials;
    private final FinancialTransactionRepository finance;
    private final HistoryService history;
    private final ZoneId businessZone;

    public ReportingService(SaleRepository sales, PurchaseRepository purchases, ExpenseRepository expenses,
                            ProductRepository products, MaterialRepository materials,
                            FinancialTransactionRepository finance, HistoryService history,
                            @Value("${app.business-zone}") String businessZone) {
        this.sales = sales;
        this.purchases = purchases;
        this.expenses = expenses;
        this.products = products;
        this.materials = materials;
        this.finance = finance;
        this.history = history;
        this.businessZone = ZoneId.of(businessZone);
    }

    private Instant start(LocalDate date) { return date.atStartOfDay(businessZone).toInstant(); }

    @Transactional(readOnly = true)
    public Dashboard dashboard() {
        LocalDate now = LocalDate.now(businessZone);
        LocalDate weekDate = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate monthDate = now.withDayOfMonth(1);
        Instant day = start(now), next = start(now.plusDays(1));
        Instant week = start(weekDate), nextWeek = start(weekDate.plusWeeks(1));
        Instant month = start(monthDate), nextMonth = start(monthDate.plusMonths(1));
        var productList = products.findAllByDeletedAtIsNullOrderByNameAsc();
        var materialList = materials.findAllByDeletedAtIsNullOrderByNameAsc();
        BigDecimal expensesToday = totalOutflows(day, next);
        BigDecimal expensesWeek = totalOutflows(week, nextWeek);
        BigDecimal expensesMonth = totalOutflows(month, nextMonth);
        Instant financeCutoff = history.cutoff(com.cestasdamel.erp.model.Enums.HistoryType.FINANCE);
        var recent = finance.findAllByOrderByOccurredAtDesc().stream().filter(item -> history.visibleAfter(item, financeCutoff)).limit(10).map(ViewMapper::financial).toList();
        return new Dashboard(
            finance.balance(),
            sales.sumBetween(day, next), sales.sumBetween(week, nextWeek), sales.sumBetween(month, nextMonth),
            expensesToday, expensesWeek, expensesMonth,
            purchases.sumBetween(day, next), purchases.sumBetween(week, nextWeek), purchases.sumBetween(month, nextMonth),
            sales.countConfirmedBetween(day, next), sales.countConfirmedBetween(week, nextWeek), sales.countConfirmedBetween(month, nextMonth),
            productList.stream().filter(item -> ViewMapper.status(item.getQuantity(), item.getMinimumStock()) == StockStatus.LOW).count(),
            productList.stream().filter(item -> item.getQuantity().signum() <= 0).count(),
            materialList.stream().filter(item -> ViewMapper.status(item.getQuantity(), item.getMinimumStock()) == StockStatus.LOW).count(),
            materialList.stream().filter(item -> item.getQuantity().signum() <= 0).count(),
            recent
        );
    }

    private BigDecimal totalOutflows(Instant from, Instant to) {
        return expenses.sumBetween(from, to).add(purchases.sumBetween(from, to));
    }

    @Transactional(readOnly = true)
    public MonthlySummary monthly(int year, int month) {
        YearMonth selected = YearMonth.of(year, month);
        Instant from = start(selected.atDay(1)), to = start(selected.plusMonths(1).atDay(1));
        BigDecimal saleTotal = sales.sumBetween(from, to);
        BigDecimal purchaseTotal = purchases.sumBetween(from, to);
        BigDecimal expenseTotal = expenses.sumBetween(from, to);
        return new MonthlySummary(year, month, saleTotal, purchaseTotal, expenseTotal, finance.balanceBetween(from, to));
    }

    @Transactional(readOnly = true)
    public CashFlowReport cashFlow(ReportPeriod period, LocalDate referenceDate) {
        LocalDate reference = referenceDate == null ? LocalDate.now(businessZone) : referenceDate;
        LocalDate from = switch (period) {
            case DAILY -> reference;
            case WEEKLY -> reference.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTHLY -> reference.withDayOfMonth(1);
        };
        LocalDate toExclusive = switch (period) {
            case DAILY -> from.plusDays(1);
            case WEEKLY -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
        };
        var transactions = finance.findByOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAsc(start(from), start(toExclusive));
        var daily = new LinkedHashMap<LocalDate, BigDecimal[]>();
        for (LocalDate date = from; date.isBefore(toExclusive); date = date.plusDays(1)) {
            daily.put(date, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        }
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        for (var transaction : transactions) {
            LocalDate date = transaction.getOccurredAt().atZone(businessZone).toLocalDate();
            BigDecimal[] totals = daily.get(date);
            if (transaction.getType() == TransactionType.INCOME) {
                income = income.add(transaction.getAmount());
                totals[0] = totals[0].add(transaction.getAmount());
            } else {
                expense = expense.add(transaction.getAmount());
                totals[1] = totals[1].add(transaction.getAmount());
            }
        }
        var points = new ArrayList<CashPoint>();
        daily.forEach((date, totals) -> points.add(new CashPoint(date, totals[0], totals[1], totals[0].subtract(totals[1]))));
        return new CashFlowReport(period, from, toExclusive.minusDays(1), income, expense, income.subtract(expense), points);
    }
}
