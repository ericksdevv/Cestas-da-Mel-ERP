import { request } from './client';
import {
  AuthResponse, Basket, BasketInput, Category, CategoryInput, CategoryType, CashFlowReport, Dashboard, Expense, ExpenseInput, FinancialTransaction,
  ManualTransactionInput, Material, MaterialInput, MonthlySummary, Movement, Product, ProductInput,
  Purchase, PurchaseInput, ReportPeriod, Sale, SaleInput, StockAlerts, RegisterInput, Production, ProductionInput,
} from './types';

const json = (value: unknown) => JSON.stringify(value);

export const erpApi = {
  health: () => request<{ status: 'UP'; database: 'UP'; timestamp: string }>('/health'),
  login: (username: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: json({ username, password }) }),
  register: (input: RegisterInput) => request('/auth/register', { method: 'POST', body: json(input) }),
  dashboard: () => request<Dashboard>('/dashboard'),
  alerts: () => request<StockAlerts>('/alerts/stock'),
  categories: (type?: CategoryType) => request<Category[]>(`/categories${type ? `?type=${type}` : ''}`),
  saveCategory: (input: CategoryInput, id?: number) => request<Category>(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: json(input) }),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),

  products: () => request<Product[]>('/products'),
  saveProduct: (input: ProductInput, id?: number) => request<Product>(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', body: json(input) }),
  uploadProductImage: (id: number, form: FormData) => request<Product>(`/products/${id}/image`, { method: 'PUT', body: form }),
  deleteProductImage: (id: number) => request<void>(`/products/${id}/image`, { method: 'DELETE' }),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  adjustProduct: (id: number, quantity: number, notes: string, unit?: import('./types').UnitOfMeasure) => request<Product>(`/products/${id}/adjust-stock`, { method: 'POST', body: json({ quantity, notes, unit }) }),

  materials: () => request<Material[]>('/materials'),
  saveMaterial: (input: MaterialInput, id?: number) => request<Material>(id ? `/materials/${id}` : '/materials', { method: id ? 'PUT' : 'POST', body: json(input) }),
  deleteMaterial: (id: number) => request<void>(`/materials/${id}`, { method: 'DELETE' }),
  adjustMaterial: (id: number, quantity: number, notes: string, unit?: import('./types').UnitOfMeasure) => request<Material>(`/materials/${id}/adjust-stock`, { method: 'POST', body: json({ quantity, notes, unit }) }),

  baskets: () => request<Basket[]>('/baskets'),
  basket: (id: number) => request<Basket>(`/baskets/${id}`),
  saveBasket: (input: BasketInput, id?: number) => request<Basket>(id ? `/baskets/${id}` : '/baskets', { method: id ? 'PUT' : 'POST', body: json(input) }),
  deleteBasket: (id: number) => request<void>(`/baskets/${id}`, { method: 'DELETE' }),

  sales: () => request<Sale[]>('/sales'),
  createSale: (input: SaleInput) => request<Sale>('/sales', { method: 'POST', body: json(input) }),
  cancelSale: (id: number, reason: string) => request<Sale>(`/sales/${id}/cancel`, { method: 'POST', body: json({ reason }) }),
  productions: () => request<Production[]>('/productions'),
  createProduction: (input: ProductionInput) => request<Production>('/productions', { method: 'POST', body: json(input) }),
  purchases: () => request<Purchase[]>('/purchases'),
  createPurchase: (input: PurchaseInput) => request<Purchase>('/purchases', { method: 'POST', body: json(input) }),
  expenses: () => request<Expense[]>('/expenses'),
  createExpense: (input: ExpenseInput) => request<Expense>('/expenses', { method: 'POST', body: json(input) }),

  transactions: () => request<FinancialTransaction[]>('/financial-transactions'),
  balance: () => request<{ balance: number }>('/financial-transactions/balance'),
  createTransaction: (input: ManualTransactionInput) => request<FinancialTransaction>('/financial-transactions', { method: 'POST', body: json(input) }),
  monthlyReport: (year: number, month: number) => request<MonthlySummary>(`/reports/monthly?year=${year}&month=${month}`),
  cashFlow: (period: ReportPeriod, referenceDate?: string) => request<CashFlowReport>(`/reports/cash-flow?period=${period}${referenceDate ? `&referenceDate=${referenceDate}` : ''}`),

  stockMovements: (productId?: number) => request<Movement[]>(`/stock-movements${productId ? `?productId=${productId}` : ''}`),
  materialMovements: (materialId?: number) => request<Movement[]>(`/material-movements${materialId ? `?materialId=${materialId}` : ''}`),
  basketMovements: (basketId?: number) => request<Movement[]>(`/basket-movements${basketId ? `?basketId=${basketId}` : ''}`),
};
