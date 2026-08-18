package com.cestasdamel.erp.model;

public final class Enums {
    private Enums() {}
    public enum UnitOfMeasure { UNIT, KG, G, L, ML, M, CM, PACKAGE, BOX }
    public enum CategoryType { PRODUCT, MATERIAL }
    public enum ReportPeriod { DAILY, WEEKLY, MONTHLY }
    public enum PaymentMethod { CASH, PIX, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, OTHER }
    public enum ItemType { PRODUCT, MATERIAL, BASKET }
    public enum MovementType { IN, OUT, ADJUSTMENT }
    public enum MovementReason { PURCHASE, SALE, BASKET_PRODUCTION, ADJUSTMENT, CANCELLATION }
    public enum TransactionType { INCOME, EXPENSE }
    public enum TransactionSource { SALE, PURCHASE, EXPENSE, MANUAL, REVERSAL }
    public enum StockStatus { OK, LOW, OUT_OF_STOCK }
    public enum SaleStatus { CONFIRMED, CANCELLED }
    public enum ProductionStatus { COMPLETED, CANCELLED }
    public enum HistoryType { SALES, PURCHASES, EXPENSES, PRODUCTIONS, FINANCE, STOCK_MOVEMENTS, MATERIAL_MOVEMENTS, BASKET_MOVEMENTS }
    public enum UserRole { ADMIN }
}
