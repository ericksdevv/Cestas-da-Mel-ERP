import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { CashFlowReport, ReportPeriod, TransactionType } from '../api/types';
import { Chips, Empty, ErrorNotice, Field, Header, ListRow, Loading, PrimaryButton, Screen, SectionTitle, Sheet, Tabs, uiStyles } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { dateTime, errorMessage, money, monthName, parseNumber } from '../utils/format';

type FinanceMode = 'cash' | 'week' | 'month';

export function FinanceScreen() {
  const now = new Date();
  const [mode, setMode] = useState<FinanceMode>('cash');
  const [manualOpen, setManualOpen] = useState(false);
  const [reference, setReference] = useState(now);
  const period: ReportPeriod = mode === 'week' ? 'WEEKLY' : 'MONTHLY';
  const referenceDate = isoDate(reference);
  const transactions = useQuery({ queryKey: ['transactions'], queryFn: erpApi.transactions, enabled: mode === 'cash' });
  const balance = useQuery({ queryKey: ['balance'], queryFn: erpApi.balance, enabled: mode === 'cash' });
  const cashFlow = useQuery({ queryKey: ['cash-flow', period, referenceDate], queryFn: () => erpApi.cashFlow(period, referenceDate), enabled: mode !== 'cash' });
  const monthly = useQuery({ queryKey: ['monthly-report', reference.getFullYear(), reference.getMonth() + 1], queryFn: () => erpApi.monthlyReport(reference.getFullYear(), reference.getMonth() + 1), enabled: mode === 'month' });
  const refreshing = transactions.isFetching || balance.isFetching || cashFlow.isFetching || monthly.isFetching;

  const shift = (direction: number) => setReference(current => {
    const next = new Date(current);
    if (mode === 'week') next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    return next;
  });

  return <Screen refreshing={refreshing}>
    <Header title="Caixa" subtitle="Entradas, saídas e evolução financeira no calendário real." />
    <Tabs<FinanceMode> values={['cash', 'week', 'month']} value={mode} labels={{ cash: 'Movimentos', week: 'Semana', month: 'Mês' }} onChange={setMode} />
    {mode === 'cash'
      ? <CashView transactions={transactions} balance={balance} onManual={() => setManualOpen(true)} />
      : <PeriodReport mode={mode} reference={reference} report={cashFlow.data} monthly={monthly.data} loading={cashFlow.isLoading || (mode === 'month' && monthly.isLoading)} error={cashFlow.error ?? monthly.error} onPrevious={() => shift(-1)} onNext={() => shift(1)} />}
    <Sheet visible={manualOpen} title="Lançamento manual" onClose={() => setManualOpen(false)}><ManualTransactionForm onDone={() => setManualOpen(false)} /></Sheet>
  </Screen>;
}

function CashView({ transactions, balance, onManual }: { transactions: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.transactions>>>>; balance: ReturnType<typeof useQuery<Awaited<ReturnType<typeof erpApi.balance>>>>; onManual(): void }) {
  const error = transactions.error ?? balance.error;
  if (transactions.isLoading || balance.isLoading) return <Loading />;
  if (error) return <ErrorNotice message={errorMessage(error)} />;
  return <><View style={styles.cashHero}><Text style={styles.cashLabel}>Caixa atual</Text><Text style={styles.cashValue}>{money(balance.data?.balance)}</Text></View><PrimaryButton title="Novo lançamento" icon="add" onPress={onManual} /><SectionTitle>Histórico</SectionTitle>{!transactions.data?.length ? <Empty message="Nenhuma movimentação financeira." /> : <View style={uiStyles.panel}>{transactions.data.map(item => <ListRow key={item.id} icon={item.type === 'INCOME' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} title={item.description} subtitle={`${sourceLabel(item.source)} · ${dateTime(item.occurredAt)}`} value={`${item.type === 'INCOME' ? '+' : '−'} ${money(item.amount)}`} tone={item.type === 'INCOME' ? 'positive' : 'danger'} />)}</View>}</>;
}

function PeriodReport({ mode, reference, report, monthly, loading, error, onPrevious, onNext }: { mode: 'week' | 'month'; reference: Date; report?: CashFlowReport; monthly?: Awaited<ReturnType<typeof erpApi.monthlyReport>>; loading: boolean; error: unknown; onPrevious(): void; onNext(): void }) {
  const label = mode === 'month' ? `${monthName(reference.getMonth() + 1)} de ${reference.getFullYear()}` : report ? `${shortDate(report.from)} a ${shortDate(report.to)}` : 'Semana selecionada';
  return <><View style={styles.periodHeader}><Pressable onPress={onPrevious} style={styles.periodArrow}><Ionicons name="chevron-back" size={21} color={colors.ink} /></Pressable><View style={styles.periodCenter}><Text style={styles.periodKicker}>{mode === 'month' ? 'RELATÓRIO MENSAL' : 'RELATÓRIO SEMANAL'}</Text><Text style={styles.periodTitle}>{label}</Text></View><Pressable onPress={onNext} style={styles.periodArrow}><Ionicons name="chevron-forward" size={21} color={colors.ink} /></Pressable></View>{loading ? <Loading /> : error ? <ErrorNotice message={errorMessage(error)} /> : report ? <><View style={styles.summary}><SummaryValue label="Entradas" value={money(report.income)} tone="positive" /><View style={styles.summaryDivider} /><SummaryValue label="Saídas" value={money(report.expense)} tone="danger" /><View style={styles.summaryDivider} /><SummaryValue label="Resultado" value={money(report.balance)} tone={report.balance >= 0 ? 'positive' : 'danger'} /></View><CashChart report={report} compact={mode === 'month'} />{mode === 'month' && monthly ? <View style={styles.breakdown}><Text style={styles.breakdownTitle}>Composição do mês</Text><BreakdownRow label="Vendas" value={monthly.sales} tone="positive" /><BreakdownRow label="Compras" value={monthly.purchases} tone="danger" /><BreakdownRow label="Gastos" value={monthly.expenses} tone="danger" /></View> : null}</> : null}</>;
}

function SummaryValue({ label, value, tone }: { label: string; value: string; tone: 'positive' | 'danger' }) { return <View style={styles.summaryValue}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryNumber, { color: tone === 'positive' ? colors.green : colors.red }]}>{value}</Text></View>; }
function BreakdownRow({ label, value, tone }: { label: string; value: number; tone: 'positive' | 'danger' }) { return <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>{label}</Text><Text style={{ color: tone === 'positive' ? colors.green : colors.red, fontWeight: '700' }}>{money(value)}</Text></View>; }

function CashChart({ report, compact }: { report: CashFlowReport; compact: boolean }) {
  const maximum = Math.max(1, ...report.points.flatMap(point => [point.income, point.expense]));
  return <View style={styles.chartCard}><View style={styles.chartHead}><View><Text style={styles.chartTitle}>Fluxo de caixa</Text><Text style={styles.chartLegend}>Entradas <Text style={{ color: colors.green }}>●</Text>  Saídas <Text style={{ color: colors.red }}>●</Text></Text></View><Ionicons name="analytics-outline" size={22} color={colors.cyan} /></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}><View style={styles.chartBaseline} />{report.points.map(point => <View key={point.date} style={[styles.chartGroup, { width: compact ? 25 : 42 }]}><View style={styles.bars}><View style={[styles.bar, styles.incomeBar, { height: Math.max(2, 112 * point.income / maximum) }]} /><View style={[styles.bar, styles.expenseBar, { height: Math.max(2, 112 * point.expense / maximum) }]} /></View><Text style={styles.chartDate}>{compact ? Number(point.date.slice(-2)) : weekday(point.date)}</Text></View>)}</ScrollView></View>;
}

function ManualTransactionForm({ onDone }: { onDone(): void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TransactionType>('INCOME');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const mutation = useMutation({ mutationFn: () => erpApi.createTransaction({ type, description: description.trim(), amount: parseNumber(amount), occurredAt: new Date().toISOString() }), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['transactions'] }), queryClient.invalidateQueries({ queryKey: ['balance'] }), queryClient.invalidateQueries({ queryKey: ['dashboard'] }), queryClient.invalidateQueries({ queryKey: ['cash-flow'] })]); Alert.alert('Lançamento registrado'); onDone(); } });
  const submit = () => { if (!description.trim() || !Number.isFinite(parseNumber(amount)) || parseNumber(amount) <= 0) return Alert.alert('Dados incompletos', 'Informe uma descrição e um valor maior que zero.'); mutation.mutate(); };
  return <><Text style={styles.formLabel}>Tipo</Text><Chips values={['INCOME', 'EXPENSE'] as const} value={type} labels={{ INCOME: 'Entrada', EXPENSE: 'Saída' }} onChange={setType} /><Field label="Descrição" value={description} onChangeText={setDescription} /><Field label="Valor" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Registrando...' : 'Registrar lançamento'} onPress={submit} disabled={mutation.isPending} /></>;
}

const sourceLabel = (source: string) => ({ SALE: 'Venda', PURCHASE: 'Compra', EXPENSE: 'Gasto', MANUAL: 'Manual', REVERSAL: 'Estorno' }[source] ?? source);
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shortDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${date}T12:00:00`));
const weekday = (date: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '');

const styles = themedStyles(colors => ({
  cashHero: { paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.border }, cashLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }, cashValue: { color: colors.ink, fontSize: 38, fontWeight: '800', marginTop: 5 },
  periodHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, periodArrow: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, periodCenter: { flex: 1, alignItems: 'center' }, periodKicker: { color: colors.cyan, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }, periodTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', marginTop: 4, textTransform: 'capitalize' },
  summary: { flexDirection: 'row', alignItems: 'stretch', paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }, summaryValue: { flex: 1, gap: 5, paddingHorizontal: 7 }, summaryLabel: { color: colors.muted, fontSize: 11 }, summaryNumber: { fontWeight: '800', fontSize: 15 }, summaryDivider: { width: 1, backgroundColor: colors.border },
  chartCard: { paddingVertical: 17, gap: 13 }, chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chartTitle: { color: colors.ink, fontSize: 17, fontWeight: '700' }, chartLegend: { color: colors.muted, fontSize: 11, marginTop: 4 }, chart: { minWidth: '100%', height: 156, alignItems: 'flex-end', paddingTop: 8, paddingHorizontal: 4, position: 'relative' }, chartBaseline: { position: 'absolute', left: 0, right: 0, bottom: 25, height: 1, backgroundColor: colors.border }, chartGroup: { height: 148, alignItems: 'center', justifyContent: 'flex-end' }, bars: { height: 116, flexDirection: 'row', gap: 3, alignItems: 'flex-end' }, bar: { width: 6, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, incomeBar: { backgroundColor: colors.green }, expenseBar: { backgroundColor: colors.red }, chartDate: { color: colors.muted, fontSize: 9, height: 23, paddingTop: 6 },
  breakdown: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }, breakdownTitle: { color: colors.ink, fontWeight: '700', marginBottom: 7 }, breakdownRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border }, breakdownLabel: { color: colors.muted }, formLabel: { color: colors.ink, fontWeight: '600' },
}));
