import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { Material, Movement, Product, PurchaseInput, UnitOfMeasure } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Empty, ErrorNotice, Field, Header, HistoryClearButton, ListRow, Loading, PrimaryButton, Screen, SecondaryButton, SectionTitle, SelectField, Sheet, Tabs, FilterPills, uiStyles } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { ReceiptImportForm } from '../components/ReceiptImportForm';
import { colors, themedStyles } from '../theme/theme';
import { dateTime, errorMessage, money, number, parseNumber, unitLabels } from '../utils/format';
import { confirmAction } from '../utils/confirm';
import { useClearHistory } from '../hooks/useClearHistory';
import { PurchaseForm } from './more/PurchaseForm';
import { ExpenseForm } from './more/ExpenseForm';

type MoreTab = 'purchases' | 'expenses' | 'movements' | 'account';

export function MoreScreen() {
  const { signOut, username } = useAuth();
  const [tab, setTab] = useState<MoreTab>('purchases');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const purchases = useQuery({ queryKey: ['purchases'], queryFn: erpApi.purchases, enabled: tab === 'purchases' });
  const expenses = useQuery({ queryKey: ['expenses'], queryFn: erpApi.expenses, enabled: tab === 'expenses' });
  const stockMovements = useQuery({ queryKey: ['stock-movements'], queryFn: () => erpApi.stockMovements(), enabled: tab === 'movements' });
  const materialMovements = useQuery({ queryKey: ['material-movements'], queryFn: () => erpApi.materialMovements(), enabled: tab === 'movements' });
  const basketMovements = useQuery({ queryKey: ['basket-movements'], queryFn: () => erpApi.basketMovements(), enabled: tab === 'movements' });
  const movementProducts = useQuery({ queryKey: ['products'], queryFn: erpApi.products, enabled: tab === 'movements' });
  const refreshing = purchases.isFetching || expenses.isFetching || stockMovements.isFetching || materialMovements.isFetching || basketMovements.isFetching || movementProducts.isFetching;
  const confirmSignOut = () => confirmAction('Sair', 'Deseja encerrar sua sessão?', () => void signOut());
  const clearPurchases = useClearHistory('PURCHASES', 'o histórico de compras', ['purchases']);
  const clearExpenses = useClearHistory('EXPENSES', 'o histórico de gastos', ['expenses']);

  return (
    <Screen refreshing={refreshing}>
      <Header title="Mais" subtitle="Compras, gastos, movimentações e conta." />
      <Tabs<MoreTab> values={['purchases', 'expenses', 'movements', 'account']} value={tab} labels={{ purchases: 'Compras', expenses: 'Gastos', movements: 'Movimentos', account: 'Conta' }} onChange={setTab} />
      {tab === 'purchases' ? <OperationsList title="Nova compra" secondaryTitle="Ler nota com IA" onSecondary={() => setReceiptOpen(true)} historyTitle="Compras registradas" onNew={() => setPurchaseOpen(true)} onClear={clearPurchases.requestClear} clearing={clearPurchases.clearing} clearError={clearPurchases.error} loading={purchases.isLoading} error={purchases.error} empty="Nenhuma compra registrada.">{(purchases.data ?? []).map((item) => <ListRow key={item.id} icon={item.receiptAccessKey?'sparkles-outline':'cart-outline'} title={item.establishment} subtitle={`${dateTime(item.purchasedAt)} · ${item.items.length} itens${item.receiptAccessKey?' · Importada por IA':''}`} value={`− ${money(item.total)}`} tone="danger" />)}</OperationsList> : null}
      {tab === 'expenses' ? <OperationsList title="Novo gasto" historyTitle="Gastos registrados" onNew={() => setExpenseOpen(true)} onClear={clearExpenses.requestClear} clearing={clearExpenses.clearing} clearError={clearExpenses.error} loading={expenses.isLoading} error={expenses.error} empty="Nenhum gasto registrado.">{(expenses.data ?? []).map((item) => <ListRow key={item.id} icon="receipt-outline" title={item.description} subtitle={`${item.category} · ${dateTime(item.occurredAt)}`} value={`− ${money(item.amount)}`} tone="danger" />)}</OperationsList> : null}
      {tab === 'movements' ? <MovementList products={stockMovements} materials={materialMovements} baskets={basketMovements} catalogProducts={movementProducts.data ?? []} /> : null}
      {tab === 'account' ? <View style={styles.account}><View style={styles.accountLogo}><Ionicons name="person-outline" size={30} color={colors.honeyInk} /></View><Text style={styles.accountName}>{username ?? 'Administrador'}</Text><Text style={styles.accountRole}>Administrador do Cestas da Mel</Text><SecondaryButton title="Sair do aplicativo" icon="log-out-outline" danger onPress={confirmSignOut} /></View> : null}
      <Sheet visible={purchaseOpen} title="Registrar compra" onClose={() => setPurchaseOpen(false)}><PurchaseForm onDone={() => setPurchaseOpen(false)} /></Sheet>
      <Sheet visible={receiptOpen} title="Ler nota fiscal" onClose={() => setReceiptOpen(false)}><ReceiptImportForm onDone={() => setReceiptOpen(false)} /></Sheet>
      <Sheet visible={expenseOpen} title="Registrar gasto" onClose={() => setExpenseOpen(false)}><ExpenseForm onDone={() => setExpenseOpen(false)} /></Sheet>
    </Screen>
  );
}

function OperationsList({ title, secondaryTitle, onSecondary, historyTitle, onNew, onClear, clearing, clearError, loading, error, empty, children }: { title: string; secondaryTitle?: string; onSecondary?: () => void; historyTitle: string; onNew(): void; onClear(): void; clearing: boolean; clearError: unknown; loading: boolean; error: unknown; empty: string; children: React.ReactNode[] }) {
  return <><View style={styles.operationActions}><View style={styles.operationAction}><PrimaryButton title={title} icon="add" onPress={onNew} /></View>{secondaryTitle&&onSecondary?<View style={styles.operationAction}><SecondaryButton title={secondaryTitle} icon="sparkles-outline" onPress={onSecondary} /></View>:null}</View><SectionTitle action={<HistoryClearButton onPress={onClear} loading={clearing} disabled={!children.length} />}>{historyTitle}</SectionTitle>{clearError ? <ErrorNotice message={errorMessage(clearError)} /> : null}{loading ? <Loading /> : error ? <ErrorNotice message={errorMessage(error)} /> : children.length ? <View style={uiStyles.panel}>{children}</View> : <Empty message={empty} />}</>;
}

function MovementList({ products, materials, baskets, catalogProducts }: { products: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.stockMovements>>>>; materials: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.materialMovements>>>>; baskets: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.basketMovements>>>>; catalogProducts: Product[] }) {
  const [kind, setKind] = useState<'products' | 'materials' | 'baskets'>('products');
  const query = kind === 'products' ? products : kind === 'materials' ? materials : baskets;
  const clearProducts = useClearHistory('STOCK_MOVEMENTS', 'os movimentos de produtos', ['stock-movements']);
  const clearMaterials = useClearHistory('MATERIAL_MOVEMENTS', 'os movimentos de materiais', ['material-movements']);
  const clearBaskets = useClearHistory('BASKET_MOVEMENTS', 'os movimentos de cestas', ['basket-movements']);
  const clear = kind === 'products' ? clearProducts : kind === 'materials' ? clearMaterials : clearBaskets;
  return <><FilterPills<'products' | 'materials' | 'baskets'> values={['products', 'materials', 'baskets']} value={kind} labels={{ products: 'Produtos', materials: 'Materiais', baskets: 'Cestas' }} onChange={setKind} /><SectionTitle action={<HistoryClearButton onPress={clear.requestClear} loading={clear.clearing} disabled={!query.data?.length} />}>Movimentações</SectionTitle>{clear.error ? <ErrorNotice message={errorMessage(clear.error)} /> : null}{query.isLoading ? <Loading /> : query.error ? <ErrorNotice message={errorMessage(query.error)} /> : !query.data?.length ? <Empty message="Nenhuma movimentação registrada." /> : <View style={styles.movements}>{query.data.map((item) => <MovementCard key={item.id} item={item} product={kind === 'products' ? catalogProducts.find((product) => product.id === item.itemId) : undefined} />)}</View>}</>;
}

function MovementCard({ item, product }: { item: Movement; product?: Product }) {
  const entered = item.quantity >= 0;
  const action = movementAction(item);
  const fallback = <View style={[styles.movementIcon, entered ? styles.movementIn : styles.movementOut]}><Ionicons name={entered ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={entered ? colors.green : colors.red} /></View>;
  return <View style={styles.movementCard}>{product ? <ProductImage productId={product.id} hasImage={product.hasImage} imageVersion={product.imageVersion} style={styles.movementPhoto} fallback={fallback} /> : fallback}<View style={styles.movementBody}><View style={styles.movementHead}><Text style={styles.movementName}>{item.itemName}</Text><Text style={[styles.movementQuantity, { color: entered ? colors.green : colors.red }]}>{entered ? '+' : '−'}{number(Math.abs(item.quantity))} {unitLabels[item.unit]}</Text></View><Text style={styles.movementAction}>{reasonLabel(item.reason)} · {action}</Text><Text style={styles.movementStock}>Quantidade em estoque após o movimento: {number(item.balanceAfter)} {unitLabels[item.unit]}</Text><Text style={styles.movementDate}>Registrado em {dateTime(item.occurredAt)}{item.referenceId ? ` · referência #${item.referenceId}` : ''}</Text>{item.notes ? <Text style={styles.movementNotes}>{item.notes}</Text> : null}</View></View>;
}

function movementAction(item: Movement) {
  if (item.reason === 'SALE') return 'saiu em uma venda';
  if (item.reason === 'PURCHASE') return 'entrou por uma compra';
  if (item.reason === 'CANCELLATION') return 'retornou por cancelamento';
  if (item.reason === 'BASKET_PRODUCTION') return item.quantity >= 0 ? 'entrou após a produção' : 'foi usado na produção';
  return item.quantity >= 0 ? 'entrou por ajuste' : 'saiu por ajuste';
}

const reasonLabel = (reason: string) => ({ PURCHASE: 'Compra', SALE: 'Venda', BASKET_PRODUCTION: 'Produção de cesta', ADJUSTMENT: 'Ajuste de estoque', CANCELLATION: 'Cancelamento' }[reason] ?? reason);

const styles = themedStyles((colors) => ({
  operationActions: { flexDirection: 'row', gap: 9 }, operationAction: { flex: 1 },
  account: { gap: 14, alignItems: 'center', paddingTop: 20 }, accountLogo: { width: 70, height: 70, borderRadius: 22, borderWidth: 1, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: .45, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 7 }, accountName: { color: colors.ink, fontSize: 23, fontWeight: '700' }, accountRole: { color: colors.muted, marginTop: -8 }, info: { width: '100%', paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceGlass },
  formTitle: { color: colors.ink, fontWeight: '700', fontSize: 17 }, purchaseItems: { paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface }, purchaseItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, check: { width: 35, height: 35, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, checkActive: { backgroundColor: colors.honey, borderColor: colors.honey }, purchasePhoto: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.surfaceSoft }, purchasePhotoFallback: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft }, purchaseBody: { flex: 1 }, purchaseName: { color: colors.ink, fontWeight: '600' }, purchaseType: { color: colors.muted, fontSize: 12, marginTop: 3 }, purchaseFields: { flexDirection: 'row', gap: 8, marginTop: 10 }, purchaseField: { flex: 1 },
  movements: { gap: 10 }, movementCard: { flexDirection: 'row', gap: 11, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceGlass }, movementIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, movementPhoto: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.surfaceSoft }, movementIn: { backgroundColor: colors.greenSoft, borderColor: colors.green }, movementOut: { backgroundColor: colors.redSoft, borderColor: colors.red }, movementBody: { flex: 1, gap: 4 }, movementHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, movementName: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' }, movementQuantity: { fontWeight: '800' }, movementAction: { color: colors.ink, fontWeight: '600' }, movementStock: { color: colors.muted, fontSize: 12 }, movementDate: { color: colors.muted, fontSize: 11 }, movementNotes: { color: colors.muted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
}));
