import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { authenticatedImageSource } from '../api/client';
import { erpApi } from '../api/erp';
import { Basket, PaymentMethod, Product, Sale, SaleInput } from '../api/types';
import { Chips, Empty, ErrorNotice, Field, Header, ListRow, Loading, PrimaryButton, Screen, SectionTitle, Sheet, Tabs, uiStyles } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { dateTime, errorMessage, money, paymentLabels } from '../utils/format';

type Sellable = { key: string; type: 'PRODUCT' | 'BASKET'; id: number; name: string; price: number; detail: string; disabled: boolean; maximum: number; hasImage?: boolean };
const paymentMethods: PaymentMethod[] = ['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER'];

export function SaleScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'new' | 'history'>('new');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const products = useQuery({ queryKey: ['products'], queryFn: erpApi.products });
  const baskets = useQuery({ queryKey: ['baskets'], queryFn: erpApi.baskets });
  const sales = useQuery({ queryKey: ['sales'], queryFn: erpApi.sales, enabled: mode === 'history' });

  const items = useMemo<Sellable[]>(() => [
    ...(products.data ?? []).filter((item) => item.active).map((item) => ({ key: `PRODUCT:${item.id}`, type: 'PRODUCT' as const, id: item.id, name: item.name, price: item.salePrice, detail: `${item.quantity} un. no estoque${item.contentQuantity && item.contentUnit ? ` · ${item.contentQuantity} ${item.contentUnit.toLowerCase()}` : ''}`, disabled: item.quantity <= 0, maximum: Math.floor(item.quantity), hasImage: item.hasImage })),
    ...(baskets.data ?? []).filter((item) => item.active).map((item) => ({ key: `BASKET:${item.id}`, type: 'BASKET' as const, id: item.id, name: item.name, price: item.salePrice, detail: `${item.quantity} cesta(s) pronta(s)`, disabled: item.quantity <= 0, maximum: Math.floor(item.quantity) })),
  ], [products.data, baskets.data]);
  const visibleItems = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const cartItems = items.filter((item) => cart[item.key]);
  const total = cartItems.reduce((sum, item) => sum + item.price * cart[item.key], 0);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const setQuantity = (key: string, quantity: number) => setCart((current) => { const next = { ...current }; const maximum=items.find(item=>item.key===key)?.maximum??0; if (quantity <= 0) delete next[key]; else next[key] = Math.min(quantity,maximum); return next; });
  const loading = products.isLoading || baskets.isLoading;
  const loadError = products.error ?? baskets.error;

  return (
    <Screen refreshing={products.isFetching || baskets.isFetching || sales.isFetching}>
      <Header title="Vendas" subtitle="Registre uma venda em poucos toques." />
      <Tabs<'new' | 'history'> values={['new', 'history']} value={mode} labels={{ new: 'Nova venda', history: 'Histórico' }} onChange={setMode} />
      {mode === 'new' ? <>
        <View style={styles.search}><Ionicons name="search" size={20} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar produto ou cesta" placeholderTextColor={colors.muted} style={styles.searchInput} /></View>
        {loading ? <Loading /> : loadError ? <ErrorNotice message={errorMessage(loadError)} onRetry={() => { void products.refetch(); void baskets.refetch(); }} /> : !visibleItems.length ? <Empty message="Nenhum item disponível para venda." /> : <View style={uiStyles.panel}>{visibleItems.map((item) => <SaleItemRow key={item.key} item={item} quantity={cart[item.key] ?? 0} onChange={(quantity) => setQuantity(item.key, quantity)} />)}</View>}
        {count ? <View style={styles.cartSummary}><View><Text style={styles.cartSmall}>{count} {count === 1 ? 'item' : 'itens'}</Text><Text style={styles.cartTotal}>{money(total)}</Text></View><PrimaryButton title="Continuar" icon="arrow-forward" onPress={() => setCheckout(true)} compact /></View> : null}
      </> : <>
        {sales.isLoading ? <Loading /> : sales.error ? <ErrorNotice message={errorMessage(sales.error)} onRetry={() => void sales.refetch()} /> : !sales.data?.length ? <Empty message="Nenhuma venda registrada." /> : <View style={uiStyles.panel}>{sales.data.map((sale) => <ListRow key={sale.id} icon={sale.status==='CANCELLED'?'close-circle-outline':'receipt-outline'} title={`Venda #${sale.id}${sale.status==='CANCELLED'?' · Cancelada':''}`} subtitle={`${paymentLabels[sale.paymentMethod]} · ${dateTime(sale.soldAt)} · ${sale.items.length} itens`} value={money(sale.total)} tone={sale.status==='CANCELLED'?'danger':'positive'} onPress={sale.status==='CONFIRMED'?()=>setSaleToCancel(sale):undefined} />)}</View>}
      </>}
      <Sheet visible={checkout} title="Finalizar venda" onClose={() => setCheckout(false)}><Checkout items={cartItems} quantities={cart} total={total} onDone={() => { setCheckout(false); setCart({}); setMode('history'); }} /></Sheet>
      <Sheet visible={saleToCancel!==null} title={`Cancelar venda #${saleToCancel?.id??''}`} onClose={()=>setSaleToCancel(null)}>{saleToCancel?<CancelSaleForm sale={saleToCancel} onDone={()=>setSaleToCancel(null)}/>:null}</Sheet>
    </Screen>
  );
}

function CancelSaleForm({ sale, onDone }: { sale: Sale; onDone(): void }) {
  const queryClient=useQueryClient(); const [reason,setReason]=useState('');
  const mutation=useMutation({mutationFn:()=>erpApi.cancelSale(sale.id,reason.trim()),onSuccess:async()=>{await Promise.all(['sales','products','baskets','dashboard','alerts','transactions','balance','stock-movements','basket-movements'].map(key=>queryClient.invalidateQueries({queryKey:[key]})));Alert.alert('Venda cancelada','O estoque e o caixa foram estornados.');onDone();}});
  const submit=()=>{if(!reason.trim())return Alert.alert('Motivo obrigatório','Informe por que a venda está sendo cancelada.');mutation.mutate();};
  return <><Text style={uiStyles.muted}>O cancelamento preserva o histórico, devolve os itens ao estoque e cria um estorno no caixa.</Text><Field label="Motivo" value={reason} onChangeText={setReason} multiline/>{mutation.error?<ErrorNotice message={errorMessage(mutation.error)}/>:null}<PrimaryButton title={mutation.isPending?'Cancelando...':'Confirmar cancelamento'} onPress={submit} disabled={mutation.isPending}/></>;
}

function SaleItemRow({ item, quantity, onChange }: { item: Sellable; quantity: number; onChange(quantity: number): void }) {
  return <View style={[styles.item, item.disabled && { opacity: .5 }]}>{item.type === 'PRODUCT' && item.hasImage ? <Image source={authenticatedImageSource(`/products/${item.id}/image`)} style={styles.itemPhoto} /> : <View style={styles.itemIcon}><Ionicons name={item.type === 'BASKET' ? 'ribbon-outline' : 'pricetag-outline'} size={21} color={colors.ink} /></View>}<View style={styles.itemBody}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemDetail}>{money(item.price)} · {item.disabled ? 'Sem estoque' : item.detail}</Text></View>{quantity ? <View style={styles.stepper}><Pressable onPress={() => onChange(quantity - 1)} style={styles.stepButton}><Ionicons name="remove" size={18} color={colors.ink} /></Pressable><Text style={styles.stepValue}>{quantity}</Text><Pressable disabled={item.disabled || quantity >= item.maximum} onPress={() => onChange(quantity + 1)} style={styles.stepButton}><Ionicons name="add" size={18} color={colors.ink} /></Pressable></View> : <Pressable disabled={item.disabled} onPress={() => onChange(1)} style={styles.add}><Ionicons name="bag-add-outline" size={21} color={colors.honeyInk} /></Pressable>}</View>;
}

function Checkout({ items, quantities, total, onDone }: { items: Sellable[]; quantities: Record<string, number>; total: number; onDone(): void }) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [observations, setObservations] = useState('');
  const mutation = useMutation({
    mutationFn: () => {
      const input: SaleInput = { soldAt: new Date().toISOString(), paymentMethod, observations: observations.trim(), items: items.map((item) => ({ type: item.type, referenceId: item.id, quantity: quantities[item.key] })) };
      return erpApi.createSale(input);
    },
    onSuccess: async (sale) => {
      await Promise.all(['sales', 'products', 'materials', 'baskets', 'dashboard', 'alerts', 'transactions', 'basket-movements'].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      Alert.alert('Venda registrada', `Total recebido: ${money(sale.total)}`);
      onDone();
    },
  });
  return <><View style={uiStyles.panel}>{items.map((item) => <ListRow key={item.key} icon={item.type === 'BASKET' ? 'gift-outline' : 'cube-outline'} title={item.name} subtitle={`${quantities[item.key]} × ${money(item.price)}`} value={money(quantities[item.key] * item.price)} />)}<View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{money(total)}</Text></View></View><SectionTitle>Forma de pagamento</SectionTitle><Chips values={paymentMethods} value={paymentMethod} labels={paymentLabels} onChange={setPaymentMethod} /><View style={styles.observation}><Text style={styles.observationLabel}>Observações</Text><TextInput value={observations} onChangeText={setObservations} multiline placeholder="Opcional" placeholderTextColor={colors.muted} style={styles.observationInput} /></View>{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Registrando...' : `Confirmar ${money(total)}`} onPress={() => mutation.mutate()} disabled={mutation.isPending} /></>;
}

const styles = themedStyles((colors) => ({
  search: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13 },
  searchInput: { flex: 1, color: colors.ink },
  item: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  itemPhoto: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.surfaceSoft },
  itemBody: { flex: 1 }, itemName: { color: colors.ink, fontWeight: '600' }, itemDetail: { color: colors.muted, fontSize: 12, marginTop: 4 },
  add: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.honey },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 7 }, stepButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, stepValue: { minWidth: 18, color: colors.ink, fontWeight: '700', textAlign: 'center' },
  cartSummary: { position: 'relative', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, backgroundColor: colors.cocoa },
  cartSmall: { color: colors.cocoaInk, opacity: .75 }, cartTotal: { color: colors.cocoaInk, fontWeight: '700', fontSize: 22, marginTop: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15 }, totalLabel: { color: colors.ink, fontWeight: '700' }, totalValue: { color: colors.ink, fontWeight: '700', fontSize: 20 },
  observation: { gap: 7 }, observationLabel: { color: colors.ink, fontWeight: '600' }, observationInput: { minHeight: 85, textAlignVertical: 'top', padding: 12, color: colors.ink, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface },
}));
