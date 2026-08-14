import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { useAuth } from '../auth/AuthContext';
import { ErrorNotice, Header, ListRow, Loading, PrimaryButton, Screen, SectionTitle, Tabs, uiStyles } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { dateTime, errorMessage, money } from '../utils/format';

export function DashboardScreen({ onNewSale }: { onNewSale(): void }) {
  const { username } = useAuth();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: erpApi.dashboard, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const alerts = useQuery({ queryKey: ['alerts'], queryFn: erpApi.alerts, refetchInterval: 60_000, refetchOnWindowFocus: true });
  const refreshing = dashboard.isFetching || alerts.isFetching;
  const refresh = () => { void dashboard.refetch(); void alerts.refetch(); };

  if (dashboard.isLoading) return <Loading />;
  if (dashboard.error) return <Screen><ErrorNotice message={errorMessage(dashboard.error)} onRetry={refresh} /></Screen>;
  const data = dashboard.data!;
  const alertCount = alerts.data?.total ?? data.productsLow + data.productsOut + data.materialsLow + data.materialsOut;
  const salesValue = period === 'today' ? data.salesToday : period === 'week' ? data.salesWeek : data.salesMonth;
  const expensesValue = period === 'today' ? data.expensesToday : period === 'week' ? data.expensesWeek : data.expensesMonth;
  const purchasesValue = period === 'today' ? data.purchasesToday : period === 'week' ? data.purchasesWeek : data.purchasesMonth;
  const countValue = period === 'today' ? data.salesCountToday : period === 'week' ? data.salesCountWeek : data.salesCountMonth;

  return (
    <Screen refreshing={refreshing}>
      <Header title={`Olá, ${username ?? 'administrador'}`} subtitle={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())} />
      <View style={styles.balance}><Text style={styles.balanceLabel}>Caixa atual</Text><Text style={styles.balanceValue}>{money(data.cashBalance)}</Text><View style={styles.balanceBottom}><Text style={styles.balanceSmall}>{money(data.salesToday)} em vendas hoje</Text><Text style={styles.balanceSmall}>{data.salesCountToday} vendas</Text></View></View>
      <Tabs<'today' | 'week' | 'month'> values={['today', 'week', 'month']} value={period} labels={{ today: 'Hoje', week: 'Semana', month: 'Mês' }} onChange={setPeriod} />
      <View style={styles.periodSummary}><PeriodValue label="Vendas" value={money(salesValue)} positive /><PeriodValue label="Gastos" value={money(expensesValue)} /><PeriodValue label="Compras" value={money(purchasesValue)} /><PeriodValue label="Nº de vendas" value={String(countValue)} positive /></View>
      <PrimaryButton title="Registrar nova venda" icon="add" onPress={onNewSale} />

      <SectionTitle>Atenção no estoque{alertCount ? ` · ${alertCount}` : ''}</SectionTitle>
      <View style={uiStyles.panel}>
        {!alerts.data?.total ? <Text style={styles.okText}>Tudo certo: nenhum item com estoque baixo.</Text> : <>
          {alerts.data.products.slice(0, 3).map((item) => <ListRow key={`p-${item.id}`} icon="alert-circle-outline" title={item.name} subtitle={`Produto · ${item.quantity} ${item.unit}`} value={item.status === 'OUT_OF_STOCK' ? 'Zerado' : 'Baixo'} tone="danger" />)}
          {alerts.data.materials.slice(0, 3).map((item) => <ListRow key={`m-${item.id}`} icon="warning-outline" title={item.name} subtitle={`Material · ${item.quantity} ${item.unit}`} value={item.status === 'OUT_OF_STOCK' ? 'Zerado' : 'Baixo'} tone="danger" />)}
          {alerts.data.baskets.slice(0, 3).map((item) => <ListRow key={`b-${item.id}`} icon="gift-outline" title={item.name} subtitle={`Cesta pronta · ${item.quantity} un.`} value={item.status === 'OUT_OF_STOCK' ? 'Zerada' : 'Baixa'} tone="danger" />)}
        </>}
      </View>

      <SectionTitle>Movimentações recentes</SectionTitle>
      <View style={uiStyles.panel}>
        {!data.recentTransactions.length ? <Text style={styles.emptyText}>Nenhuma movimentação registrada.</Text> : data.recentTransactions.map((item) => <ListRow key={item.id} icon={item.type === 'INCOME' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} title={item.description} subtitle={dateTime(item.occurredAt)} value={`${item.type === 'INCOME' ? '+' : '−'} ${money(item.amount)}`} tone={item.type === 'INCOME' ? 'positive' : 'danger'} />)}
      </View>
    </Screen>
  );
}

function PeriodValue({ label, value, positive }: { label: string; value: string; positive?: boolean }) { return <View style={styles.periodValue}><Text style={styles.periodLabel}>{label}</Text><Text style={[styles.periodNumber, { color: positive ? colors.green : colors.ink }]}>{value}</Text></View>; }

const styles = themedStyles((colors) => ({
  balance: { padding: 20, borderRadius: 18, backgroundColor: colors.cocoa },
  balanceLabel: { color: colors.cocoaInk, opacity: .76 },
  balanceValue: { color: colors.cocoaInk, fontSize: 31, fontWeight: '700', marginVertical: 8 },
  balanceBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  balanceSmall: { color: colors.cocoaInk, fontSize: 12, opacity: .82 },
  periodSummary: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 7 }, periodValue: { width: '50%', paddingVertical: 9, paddingHorizontal: 7 }, periodLabel: { color: colors.muted, fontSize: 11 }, periodNumber: { color: colors.ink, fontWeight: '800', fontSize: 16, marginTop: 3 },
  okText: { color: colors.green, paddingVertical: 12, textAlign: 'center' },
  emptyText: { color: colors.muted, paddingVertical: 12, textAlign: 'center' },
}));
