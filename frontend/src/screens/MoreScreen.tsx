import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { Material, Movement, Product, PurchaseInput, UnitOfMeasure } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Chips, Empty, ErrorNotice, Field, Header, ListRow, Loading, PrimaryButton, Screen, SecondaryButton, Sheet, Tabs, uiStyles } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { dateTime, errorMessage, money, number, parseNumber, unitLabels } from '../utils/format';
import { confirmAction } from '../utils/confirm';

type MoreTab = 'purchases' | 'expenses' | 'movements' | 'account';

export function MoreScreen() {
  const { signOut, username } = useAuth();
  const [tab, setTab] = useState<MoreTab>('purchases');
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const purchases = useQuery({ queryKey: ['purchases'], queryFn: erpApi.purchases, enabled: tab === 'purchases' });
  const expenses = useQuery({ queryKey: ['expenses'], queryFn: erpApi.expenses, enabled: tab === 'expenses' });
  const stockMovements = useQuery({ queryKey: ['stock-movements'], queryFn: () => erpApi.stockMovements(), enabled: tab === 'movements' });
  const materialMovements = useQuery({ queryKey: ['material-movements'], queryFn: () => erpApi.materialMovements(), enabled: tab === 'movements' });
  const basketMovements = useQuery({ queryKey: ['basket-movements'], queryFn: () => erpApi.basketMovements(), enabled: tab === 'movements' });
  const refreshing = purchases.isFetching || expenses.isFetching || stockMovements.isFetching || materialMovements.isFetching || basketMovements.isFetching;
  const confirmSignOut = () => confirmAction('Sair', 'Deseja encerrar sua sessão?', () => void signOut());

  return (
    <Screen refreshing={refreshing}>
      <Header title="Mais" subtitle="Compras, gastos, movimentações e conta." />
      <Tabs<MoreTab> values={['purchases', 'expenses', 'movements', 'account']} value={tab} labels={{ purchases: 'Compras', expenses: 'Gastos', movements: 'Movimentos', account: 'Conta' }} onChange={setTab} />
      {tab === 'purchases' ? <OperationsList title="Nova compra" onNew={() => setPurchaseOpen(true)} loading={purchases.isLoading} error={purchases.error} empty="Nenhuma compra registrada.">{(purchases.data ?? []).map((item) => <ListRow key={item.id} icon="cart-outline" title={item.establishment} subtitle={`${dateTime(item.purchasedAt)} · ${item.items.length} itens`} value={`− ${money(item.total)}`} tone="danger" />)}</OperationsList> : null}
      {tab === 'expenses' ? <OperationsList title="Novo gasto" onNew={() => setExpenseOpen(true)} loading={expenses.isLoading} error={expenses.error} empty="Nenhum gasto registrado.">{(expenses.data ?? []).map((item) => <ListRow key={item.id} icon="receipt-outline" title={item.description} subtitle={`${item.category} · ${dateTime(item.occurredAt)}`} value={`− ${money(item.amount)}`} tone="danger" />)}</OperationsList> : null}
      {tab === 'movements' ? <MovementList products={stockMovements} materials={materialMovements} baskets={basketMovements} /> : null}
      {tab === 'account' ? <View style={styles.account}><View style={styles.accountLogo}><Ionicons name="person-outline" size={30} color={colors.honeyInk} /></View><Text style={styles.accountName}>{username ?? 'Administrador'}</Text><Text style={styles.accountRole}>Administrador do Cestas da Mel</Text><SecondaryButton title="Sair do aplicativo" icon="log-out-outline" danger onPress={confirmSignOut} /></View> : null}
      <Sheet visible={purchaseOpen} title="Registrar compra" onClose={() => setPurchaseOpen(false)}><PurchaseForm onDone={() => setPurchaseOpen(false)} /></Sheet>
      <Sheet visible={expenseOpen} title="Registrar gasto" onClose={() => setExpenseOpen(false)}><ExpenseForm onDone={() => setExpenseOpen(false)} /></Sheet>
    </Screen>
  );
}

function OperationsList({ title, onNew, loading, error, empty, children }: { title: string; onNew(): void; loading: boolean; error: unknown; empty: string; children: React.ReactNode[] }) {
  return <><PrimaryButton title={title} icon="add" onPress={onNew} />{loading ? <Loading /> : error ? <ErrorNotice message={errorMessage(error)} /> : children.length ? <View style={uiStyles.panel}>{children}</View> : <Empty message={empty} />}</>;
}

function MovementList({ products, materials, baskets }: { products: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.stockMovements>>>>; materials: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.materialMovements>>>>; baskets: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.basketMovements>>>> }) {
  const [kind, setKind] = useState<'products' | 'materials' | 'baskets'>('products');
  const query = kind === 'products' ? products : kind === 'materials' ? materials : baskets;
  return <><Tabs<'products' | 'materials' | 'baskets'> values={['products', 'materials', 'baskets']} value={kind} labels={{ products: 'Produtos', materials: 'Materiais', baskets: 'Cestas' }} onChange={setKind} />{query.isLoading ? <Loading /> : query.error ? <ErrorNotice message={errorMessage(query.error)} /> : !query.data?.length ? <Empty message="Nenhuma movimentação registrada." /> : <View style={styles.movements}>{query.data.map((item) => <MovementCard key={item.id} item={item} />)}</View>}</>;
}

function MovementCard({ item }: { item: Movement }) {
  const entered = item.quantity >= 0;
  const action = movementAction(item);
  return <View style={styles.movementCard}><View style={[styles.movementIcon, entered ? styles.movementIn : styles.movementOut]}><Ionicons name={entered ? 'arrow-down-outline' : 'arrow-up-outline'} size={20} color={entered ? colors.green : colors.red} /></View><View style={styles.movementBody}><View style={styles.movementHead}><Text style={styles.movementName}>{item.itemName}</Text><Text style={[styles.movementQuantity, { color: entered ? colors.green : colors.red }]}>{entered ? '+' : '−'}{number(Math.abs(item.quantity))} {unitLabels[item.unit]}</Text></View><Text style={styles.movementAction}>{reasonLabel(item.reason)} · {action}</Text><Text style={styles.movementStock}>Quantidade em estoque após o movimento: {number(item.balanceAfter)} {unitLabels[item.unit]}</Text><Text style={styles.movementDate}>Registrado em {dateTime(item.occurredAt)}{item.referenceId ? ` · referência #${item.referenceId}` : ''}</Text>{item.notes ? <Text style={styles.movementNotes}>{item.notes}</Text> : null}</View></View>;
}

function movementAction(item: Movement) {
  if (item.reason === 'SALE') return 'saiu em uma venda';
  if (item.reason === 'PURCHASE') return 'entrou por uma compra';
  if (item.reason === 'CANCELLATION') return 'retornou por cancelamento';
  if (item.reason === 'BASKET_PRODUCTION') return item.quantity >= 0 ? 'entrou após a produção' : 'foi usado na produção';
  return item.quantity >= 0 ? 'entrou por ajuste' : 'saiu por ajuste';
}

type PurchaseSelection = Record<string, { type: 'PRODUCT' | 'MATERIAL'; id: number; name: string; quantity: string; unit: UnitOfMeasure; unitCost: string }>;
function PurchaseForm({ onDone }: { onDone(): void }) {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['products'], queryFn: erpApi.products });
  const materials = useQuery({ queryKey: ['materials'], queryFn: erpApi.materials });
  const [establishment, setEstablishment] = useState('');
  const [observations, setObservations] = useState('');
  const [selection, setSelection] = useState<PurchaseSelection>({});
  const items = useMemo(() => [
    ...(products.data ?? []).filter((item) => item.active).map((item) => ({ type: 'PRODUCT' as const, item, cost: item.purchasePrice })),
    ...(materials.data ?? []).filter((item) => item.active).map((item) => ({ type: 'MATERIAL' as const, item, cost: item.unitCost })),
  ], [products.data, materials.data]);
  const toggle = (type: 'PRODUCT' | 'MATERIAL', item: Product | Material, cost: number) => setSelection((current) => { const key = `${type}:${item.id}`; const next = { ...current }; if (next[key]) delete next[key]; else next[key] = { type, id: item.id, name: item.name, quantity: '1', unit: item.unit, unitCost: String(cost) }; return next; });
  const update = (key: string, field: 'quantity' | 'unitCost' | 'unit', value: string) => setSelection((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));
  const mutation = useMutation({ mutationFn: (input: PurchaseInput) => erpApi.createPurchase(input), onSuccess: async (purchase) => { await Promise.all(['purchases', 'products', 'materials', 'dashboard', 'transactions', 'balance', 'alerts', 'stock-movements', 'material-movements'].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))); Alert.alert('Compra registrada', `Total: ${money(purchase.total)}`); onDone(); } });
  const submit = () => {
    const lines = Object.values(selection).map((item) => ({ type: item.type, referenceId: item.id, quantity: parseNumber(item.quantity), unit: item.unit, unitCost: parseNumber(item.unitCost) }));
    if (!establishment.trim()) return Alert.alert('Estabelecimento obrigatório');
    if (!lines.length || lines.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) return Alert.alert('Itens inválidos', 'Selecione ao menos um item e revise quantidade e custo.');
    mutation.mutate({ establishment: establishment.trim(), purchasedAt: new Date().toISOString(), observations: observations.trim(), items: lines });
  };
  return <><Field label="Estabelecimento" value={establishment} onChangeText={setEstablishment} placeholder="Ex.: Atacadista Central" /><Field label="Observações" value={observations} onChangeText={setObservations} multiline /><Text style={styles.formTitle}>Itens comprados</Text>{products.isLoading || materials.isLoading ? <Loading /> : <View style={styles.purchaseItems}>{items.map(({ type, item, cost }) => { const key = `${type}:${item.id}`; const selected = selection[key]; const units = compatibleUnits(item.unit); return <View key={key} style={styles.purchaseItem}><Pressable onPress={() => toggle(type, item, cost)} style={[styles.check, selected && styles.checkActive]}><Ionicons name={selected ? 'checkmark' : 'add'} size={18} color={selected ? colors.honeyInk : colors.muted} /></Pressable><View style={styles.purchaseBody}><Text style={styles.purchaseName}>{item.name}</Text><Text style={styles.purchaseType}>{type === 'PRODUCT' ? 'Produto' : 'Material'} · {number(item.quantity)} {unitLabels[item.unit]}</Text>{selected ? <><View style={styles.purchaseFields}><View style={styles.purchaseField}><Field label="Quantidade" value={selected.quantity} onChangeText={(value) => update(key, 'quantity', value)} keyboardType="decimal-pad" /></View><View style={styles.purchaseField}><Field label={`Custo por ${unitLabels[selected.unit]}`} value={selected.unitCost} onChangeText={(value) => update(key, 'unitCost', value)} keyboardType="decimal-pad" /></View></View>{units.length > 1 ? <Chips values={units} value={selected.unit} labels={Object.fromEntries(units.map((unit) => [unit, unitLabels[unit]])) as Record<UnitOfMeasure, string>} onChange={(unit) => update(key, 'unit', unit)} /> : null}</> : null}</View></View>; })}</View>}{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Registrando...' : 'Registrar compra'} onPress={submit} disabled={mutation.isPending} /></>;
}

function ExpenseForm({ onDone }: { onDone(): void }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [observations, setObservations] = useState('');
  const mutation = useMutation({ mutationFn: () => erpApi.createExpense({ description: description.trim(), category: category.trim(), amount: parseNumber(amount), observations: observations.trim(), occurredAt: new Date().toISOString() }), onSuccess: async () => { await Promise.all(['expenses', 'transactions', 'balance', 'dashboard'].map((key) => queryClient.invalidateQueries({ queryKey: [key] }))); Alert.alert('Gasto registrado'); onDone(); } });
  const submit = () => { if (!description.trim() || !category.trim() || !Number.isFinite(parseNumber(amount)) || parseNumber(amount) <= 0) return Alert.alert('Dados incompletos', 'Preencha descrição, categoria e um valor maior que zero.'); mutation.mutate(); };
  return <><Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Ex.: Conta de energia" /><Field label="Categoria" value={category} onChangeText={setCategory} placeholder="Ex.: Utilidades" /><Field label="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" /><Field label="Observações" value={observations} onChangeText={setObservations} multiline />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Registrando...' : 'Registrar gasto'} onPress={submit} disabled={mutation.isPending} /></>;
}

const reasonLabel = (reason: string) => ({ PURCHASE: 'Compra', SALE: 'Venda', BASKET_PRODUCTION: 'Produção de cesta', ADJUSTMENT: 'Ajuste de estoque', CANCELLATION: 'Cancelamento' }[reason] ?? reason);
const compatibleUnits = (unit: UnitOfMeasure): UnitOfMeasure[] => unit === 'KG' || unit === 'G' ? ['KG', 'G'] : unit === 'L' || unit === 'ML' ? ['L', 'ML'] : unit === 'M' || unit === 'CM' ? ['M', 'CM'] : [unit];

const styles = themedStyles((colors) => ({
  account: { gap: 14, alignItems: 'center', paddingTop: 20 }, accountLogo: { width: 70, height: 70, borderRadius: 22, borderWidth: 1, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: .45, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 7 }, accountName: { color: colors.ink, fontSize: 23, fontWeight: '700' }, accountRole: { color: colors.muted, marginTop: -8 }, info: { width: '100%', paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceGlass },
  formTitle: { color: colors.ink, fontWeight: '700', fontSize: 17 }, purchaseItems: { paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface }, purchaseItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, check: { width: 35, height: 35, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, checkActive: { backgroundColor: colors.honey, borderColor: colors.honey }, purchaseBody: { flex: 1 }, purchaseName: { color: colors.ink, fontWeight: '600' }, purchaseType: { color: colors.muted, fontSize: 12, marginTop: 3 }, purchaseFields: { flexDirection: 'row', gap: 8, marginTop: 10 }, purchaseField: { flex: 1 },
  movements: { gap: 10 }, movementCard: { flexDirection: 'row', gap: 11, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceGlass }, movementIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, movementIn: { backgroundColor: colors.greenSoft, borderColor: colors.green }, movementOut: { backgroundColor: colors.redSoft, borderColor: colors.red }, movementBody: { flex: 1, gap: 4 }, movementHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, movementName: { flex: 1, color: colors.ink, fontSize: 16, fontWeight: '700' }, movementQuantity: { fontWeight: '800' }, movementAction: { color: colors.ink, fontWeight: '600' }, movementStock: { color: colors.muted, fontSize: 12 }, movementDate: { color: colors.muted, fontSize: 11 }, movementNotes: { color: colors.muted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
}));
