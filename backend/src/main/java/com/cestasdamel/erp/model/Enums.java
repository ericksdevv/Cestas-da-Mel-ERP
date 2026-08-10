package com.cestasdamel.erp.model;

public final class Enums {
    private Enums() {}
    public enum UnitOfMeasure { UNIT, KG, G, L, ML, M, CM, PACKAGE, BOX }
    public enum PaymentMethod { CASH, PIX, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, OTHER }
    public enum ItemType { PRODUCT, MATERIAL, BASKET }
    public enum MovementType { IN, OUT, ADJUSTMENT }
    public enum MovementReason { PURCHASE, SALE, BASKET_PRODUCTION, ADJUSTMENT, CANCELLATION }
    public enum TransactionType { INCOME, EXPENSE }
    public enum TransactionSource { SALE, PURCHASE, EXPENSE, MANUAL }
    public enum StockStatus { OK, LOW, OUT_OF_STOCK }
}
