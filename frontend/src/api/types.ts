export type UnitOfMeasure = 'UNIT' | 'KG' | 'G' | 'L' | 'ML' | 'M' | 'CM' | 'PACKAGE' | 'BOX';
export type CategoryType = 'PRODUCT' | 'MATERIAL';
export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'OTHER';
export type ItemType = 'PRODUCT' | 'MATERIAL' | 'BASKET';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type MovementReason = 'PURCHASE' | 'SALE' | 'BASKET_PRODUCTION' | 'ADJUSTMENT' | 'CANCELLATION';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionSource = 'SALE' | 'PURCHASE' | 'EXPENSE' | 'MANUAL' | 'REVERSAL';
export type SaleStatus = 'CONFIRMED' | 'CANCELLED';
export type ProductionStatus = 'COMPLETED' | 'CANCELLED';
export type StockStatus = 'OK' | 'LOW' | 'OUT_OF_STOCK';

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fields?: Record<string, string>;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  username: string;
}
export interface RegisterInput { name: string; username: string; password: string }

export interface Category { id: number; name: string; type: CategoryType }
export interface CategoryInput { name: string; type: CategoryType }

export interface Product {
  id: number;
  name: string;
  description?: string;
  category?: Category;
  unit: UnitOfMeasure;
  quantity: number;
  minimumStock: number;
  purchasePrice: number;
  salePrice: number;
  active: boolean;
  status: StockStatus;
  contentQuantity?: number;
  contentUnit?: UnitOfMeasure;
  hasImage: boolean;
  imageVersion?: number;
}

export interface Material {
  id: number;
  name: string;
  description?: string;
  category?: Category;
  unit: UnitOfMeasure;
  quantity: number;
  minimumStock: number;
  unitCost: number;
  active: boolean;
  status: StockStatus;
  contentQuantity?: number;
  contentUnit?: UnitOfMeasure;
}

export interface ComponentItem {
  id: number;
  name: string;
  quantity: number;
  unit: UnitOfMeasure;
}

export interface Basket {
  id: number;
  name: string;
  description?: string;
  salePrice: number;
  quantity: number;
  minimumStock: number;
  active: boolean;
  status: StockStatus;
  maximumProducible: number;
  products: ComponentItem[];
  materials: ComponentItem[];
}

export interface OperationItem {
  id: number;
  type: ItemType;
  referenceId: number;
  name: string;
  quantity: number;
  unitValue: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  soldAt: string;
  paymentMethod: PaymentMethod;
  total: number;
  status: SaleStatus;
  observations?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OperationItem[];
}
export interface Production { id: number; basketId: number; basketName: string; quantity: number; unitCost: number; totalCost: number; producedAt: string; responsible: string; notes?: string; status: ProductionStatus }

export interface Purchase {
  id: number;
  establishment: string;
  purchasedAt: string;
  total: number;
  observations?: string;
  items: OperationItem[];
  receiptAccessKey?: string;
}

export interface ReceiptItemSuggestion {
  index: number;
  name: string;
  barcode?: string;
  quantity: number;
  inventoryUnit: UnitOfMeasure;
  contentQuantity?: number;
  contentUnit?: UnitOfMeasure;
  unitCost: number;
  subtotal: number;
  suggestedType: 'PRODUCT' | 'MATERIAL';
  categoryName: string;
  matchedReferenceId?: number;
  matchedName?: string;
  confidence: number;
}

export interface ReceiptAnalysis {
  establishment: string;
  cnpj?: string;
  accessKey?: string;
  purchasedAt: string;
  total: number;
  items: ReceiptItemSuggestion[];
  warnings: string[];
}

export interface ReceiptImportConfirmation {
  establishment: string;
  purchasedAt?: string;
  observations?: string;
  receiptAccessKey?: string;
  items: Array<{
    type: 'PRODUCT' | 'MATERIAL'; referenceId?: number; name: string; categoryName?: string;
    quantity: number; unit: UnitOfMeasure; contentQuantity?: number; contentUnit?: UnitOfMeasure;
    unitCost: number; salePrice?: number;
  }>;
}

export interface Expense {
  id: number;
  description: string;
  category: string;
  occurredAt: string;
  amount: number;
  observations?: string;
}

export interface FinancialTransaction {
  id: number;
  type: TransactionType;
  source: TransactionSource;
  referenceId?: number;
  description: string;
  amount: number;
  occurredAt: string;
}

export interface Movement {
  id: number;
  itemId: number;
  itemName: string;
  unit: UnitOfMeasure;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  balanceAfter: number;
  referenceId?: number;
  notes?: string;
  occurredAt: string;
}

export interface Dashboard {
  cashBalance: number;
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  expensesToday: number;
  expensesWeek: number;
  expensesMonth: number;
  purchasesToday: number;
  purchasesWeek: number;
  purchasesMonth: number;
  salesCountToday: number;
  salesCountWeek: number;
  salesCountMonth: number;
  productsLow: number;
  productsOut: number;
  materialsLow: number;
  materialsOut: number;
  recentTransactions: FinancialTransaction[];
}

export interface MonthlySummary {
  year: number;
  month: number;
  sales: number;
  purchases: number;
  expenses: number;
  netCash: number;
}

export interface CashPoint { date: string; income: number; expense: number; balance: number }
export interface CashFlowReport { period: ReportPeriod; from: string; to: string; income: number; expense: number; balance: number; points: CashPoint[] }

export interface StockAlerts {
  products: Product[];
  materials: Material[];
  baskets: Basket[];
  total: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  categoryId?: number;
  contentQuantity?: number;
  contentUnit?: UnitOfMeasure;
  quantity: number;
  minimumStock: number;
  purchasePrice: number;
  salePrice: number;
  active: boolean;
}

export interface MaterialInput {
  name: string;
  description?: string;
  categoryId?: number;
  contentQuantity?: number;
  contentUnit?: UnitOfMeasure;
  unit: UnitOfMeasure;
  quantity: number;
  minimumStock: number;
  unitCost: number;
  active: boolean;
}

export interface BasketInput {
  name: string;
  description?: string;
  salePrice: number;
  minimumStock: number;
  active: boolean;
  products: { id: number; quantity: number }[];
  materials: { id: number; quantity: number }[];
}

export interface SaleInput {
  soldAt?: string;
  paymentMethod: PaymentMethod;
  observations?: string;
  items: { type: 'PRODUCT' | 'BASKET'; referenceId: number; quantity: number; unitPrice?: number }[];
}

export interface PurchaseInput {
  establishment: string;
  purchasedAt?: string;
  observations?: string;
  items: { type: 'PRODUCT' | 'MATERIAL'; referenceId: number; quantity: number; unit?: UnitOfMeasure; unitCost: number }[];
  receiptAccessKey?: string;
}
export interface ProductionInput { basketId: number; quantity: number; producedAt?: string; notes?: string }

export interface ExpenseInput {
  description: string;
  category: string;
  occurredAt?: string;
  amount: number;
  observations?: string;
}

export interface ManualTransactionInput {
  type: TransactionType;
  description: string;
  amount: number;
  occurredAt?: string;
}
