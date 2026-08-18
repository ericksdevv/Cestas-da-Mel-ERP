import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { erpApi } from '../api/erp';
import { Basket, BasketInput, Category, CategoryType, Material, MaterialInput, Product, ProductInput, UnitOfMeasure } from '../api/types';
import { Empty, ErrorNotice, Field, Header, HistoryClearButton, ListRow, Loading, PrimaryButton, Screen, SecondaryButton, SectionTitle, SelectField, Sheet, Tabs, uiStyles } from '../components/ui';
import { ProductImage } from '../components/ProductImage';
import { colors, themedStyles } from '../theme/theme';
import { errorMessage, money, number, parseNumber, unitLabels } from '../utils/format';
import { confirmAction } from '../utils/confirm';
import { useClearHistory } from '../hooks/useClearHistory';
import { ProductForm } from './catalog/ProductForm';
import { MaterialForm } from './catalog/MaterialForm';
import { BasketForm } from './catalog/BasketForm';
import { ProductionForm } from './catalog/ProductionForm';
import { StockForm, StockTarget } from './catalog/StockForm';
import { CategoryManager } from './catalog/CategoryManager';

type CatalogTab = 'products' | 'materials' | 'baskets' | 'production';

export function CatalogScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CatalogTab>('products');
  const [productForm, setProductForm] = useState<Product | null | undefined>(undefined);
  const [materialForm, setMaterialForm] = useState<Material | null | undefined>(undefined);
  const [basketForm, setBasketForm] = useState<Basket | null | undefined>(undefined);
  const [stockTarget, setStockTarget] = useState<StockTarget | null>(null);
  const [productionOpen, setProductionOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const products = useQuery({ queryKey: ['products'], queryFn: erpApi.products });
  const materials = useQuery({ queryKey: ['materials'], queryFn: erpApi.materials });
  const baskets = useQuery({ queryKey: ['baskets'], queryFn: erpApi.baskets });
  const productions = useQuery({ queryKey: ['productions'], queryFn: erpApi.productions });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => erpApi.categories() });
  const clearProductions = useClearHistory('PRODUCTIONS', 'o histórico de produção', ['productions']);
  const activeQuery = tab === 'products' ? products : tab === 'materials' ? materials : tab === 'baskets' ? baskets : productions;
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['materials'] }),
      queryClient.invalidateQueries({ queryKey: ['baskets'] }),
      queryClient.invalidateQueries({ queryKey: ['productions'] }),
      queryClient.invalidateQueries({ queryKey: ['alerts'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['categories'] }),
    ]);
  };
  const deletion = useMutation({
    mutationFn: ({ kind, id }: { kind: 'product' | 'material' | 'basket'; id: number }) => kind === 'product' ? erpApi.deleteProduct(id) : kind === 'material' ? erpApi.deleteMaterial(id) : erpApi.deleteBasket(id),
    onSuccess: async (_, variables) => { await invalidate(); Alert.alert(variables.kind === 'product' ? 'Produto excluído' : variables.kind === 'material' ? 'Material excluído' : 'Cesta excluída', 'O histórico anterior foi preservado.'); },
  });
  const requestDelete = (kind: 'product' | 'material' | 'basket', id: number, name: string) => {
    deletion.reset();
    confirmAction(`Excluir ${name}?`, 'O cadastro sairá das listas, mas vendas, compras e movimentações anteriores continuarão salvas.', () => deletion.mutate({ kind, id }));
  };

  const openNew = () => {
    if (tab === 'products') setProductForm(null);
    if (tab === 'materials') setMaterialForm(null);
    if (tab === 'baskets') setBasketForm(null);
    if (tab === 'production') setProductionOpen(true);
  };

  return (
    <Screen refreshing={activeQuery.isFetching}>
      <Header title="Estoque" subtitle="Produtos, materiais e composição das cestas." action={tab === 'products' || tab === 'materials' ? <Pressable onPress={() => setCategoryOpen(true)} accessibilityLabel="Gerenciar categorias" style={({ pressed }) => [styles.headerIcon, pressed && styles.actionPressed]}><Ionicons name="folder-open-outline" size={20} color={colors.cyan} /></Pressable> : undefined} />
      <Tabs<CatalogTab> values={['products', 'materials', 'baskets', 'production']} value={tab} labels={{ products: 'Produtos', materials: 'Materiais', baskets: 'Cestas', production: 'Produção' }} onChange={setTab} />
      <PrimaryButton title={tab === 'products' ? 'Novo produto' : tab === 'materials' ? 'Novo material' : tab === 'baskets' ? 'Novo modelo de cesta' : 'Produzir cestas'} icon="add" onPress={openNew} />
      {deletion.error ? <ErrorNotice message={errorMessage(deletion.error)} /> : null}

      {activeQuery.isLoading ? <Loading /> : activeQuery.error ? <ErrorNotice message={errorMessage(activeQuery.error)} onRetry={() => void activeQuery.refetch()} /> : null}
      {tab === 'products' && products.data ? <CatalogList empty="Nenhum produto cadastrado.">{products.data.map((item) => <ProductRow key={item.id} item={item} onEdit={() => setProductForm(item)} onStock={() => setStockTarget({ kind: 'product', item })} onDelete={() => requestDelete('product', item.id, item.name)} />)}</CatalogList> : null}
      {tab === 'materials' && materials.data ? <CatalogList empty="Nenhum material cadastrado.">{materials.data.map((item) => <MaterialRow key={item.id} item={item} onEdit={() => setMaterialForm(item)} onStock={() => setStockTarget({ kind: 'material', item })} onDelete={() => requestDelete('material', item.id, item.name)} />)}</CatalogList> : null}
      {tab === 'baskets' && baskets.data ? <CatalogList empty="Nenhuma cesta cadastrada.">{baskets.data.map((item) => <BasketRow key={item.id} item={item} onEdit={() => setBasketForm(item)} onDelete={() => requestDelete('basket', item.id, item.name)} />)}</CatalogList> : null}
      {tab === 'production' && productions.data ? <><SectionTitle action={<HistoryClearButton onPress={clearProductions.requestClear} loading={clearProductions.clearing} disabled={!productions.data.length} />}>Produções registradas</SectionTitle>{clearProductions.error ? <ErrorNotice message={errorMessage(clearProductions.error)} /> : null}<CatalogList empty="Nenhuma produção registrada.">{productions.data.map((item) => <ListRow key={item.id} icon="construct-outline" title={`${number(item.quantity)} × ${item.basketName}`} subtitle={`${item.responsible} · ${new Date(item.producedAt).toLocaleString('pt-BR')}`} value={money(item.totalCost)} />)}</CatalogList></> : null}

      <Sheet visible={productForm !== undefined} title={productForm ? 'Editar produto' : 'Novo produto'} onClose={() => setProductForm(undefined)}>{productForm !== undefined ? <ProductForm item={productForm} categories={(categories.data ?? []).filter(item => item.type === 'PRODUCT')} onSaved={async () => { setProductForm(undefined); await invalidate(); }} /> : null}</Sheet>
      <Sheet visible={materialForm !== undefined} title={materialForm ? 'Editar material' : 'Novo material'} onClose={() => setMaterialForm(undefined)}>{materialForm !== undefined ? <MaterialForm item={materialForm} categories={(categories.data ?? []).filter(item => item.type === 'MATERIAL')} onSaved={async () => { setMaterialForm(undefined); await invalidate(); }} /> : null}</Sheet>
      <Sheet visible={basketForm !== undefined} title={basketForm ? 'Editar cesta' : 'Nova cesta'} onClose={() => setBasketForm(undefined)}>{basketForm !== undefined ? <BasketForm item={basketForm} products={products.data ?? []} materials={materials.data ?? []} onSaved={async () => { setBasketForm(undefined); await invalidate(); }} /> : null}</Sheet>
      <Sheet visible={stockTarget !== null} title="Ajustar estoque" onClose={() => setStockTarget(null)}>{stockTarget ? <StockForm target={stockTarget} onSaved={async () => { setStockTarget(null); await invalidate(); }} /> : null}</Sheet>
      <Sheet visible={productionOpen} title="Produzir cestas" onClose={() => setProductionOpen(false)}><ProductionForm baskets={baskets.data ?? []} onSaved={async () => { setProductionOpen(false); await invalidate(); }} /></Sheet>
      <Sheet visible={categoryOpen} title={tab === 'materials' ? 'Categorias de materiais' : 'Categorias de produtos'} onClose={() => setCategoryOpen(false)}><CategoryManager type={tab === 'materials' ? 'MATERIAL' : 'PRODUCT'} categories={(categories.data ?? []).filter(item => item.type === (tab === 'materials' ? 'MATERIAL' : 'PRODUCT'))} onChanged={invalidate} /></Sheet>
    </Screen>
  );
}

function CatalogList({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  return <View style={uiStyles.panel}>{children.length ? children : <Empty message={empty} />}</View>;
}

function ProductRow({ item, onEdit, onStock, onDelete }: { item: Product; onEdit(): void; onStock(): void; onDelete(): void }) {
  const content = item.contentQuantity && item.contentUnit ? ` · ${number(item.contentQuantity)} ${unitLabels[item.contentUnit]}` : '';
  return <View style={styles.productRow}>
    <ProductImage productId={item.id} hasImage={item.hasImage} imageVersion={item.imageVersion} style={styles.productThumb} fallback={<View style={styles.productThumbEmpty}><Ionicons name="pricetag-outline" size={22} color={colors.cyan} /></View>} />
    <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{item.category ? `${item.category.name} · ` : ''}{number(item.quantity)} un. em estoque{content}</Text><Text style={[styles.productPrice, item.status !== 'OK' && { color: colors.red }]}>{money(item.salePrice)}</Text></View>
    <View style={styles.rowActions}><Pressable onPress={onStock} accessibilityLabel={`Ajustar estoque de ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="layers-outline" size={18} color={colors.cyan} /></Pressable><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>
  </View>;
}

function MaterialRow({ item, onEdit, onStock, onDelete }: { item: Material; onEdit(): void; onStock(): void; onDelete(): void }) {
  const content = item.contentQuantity && item.contentUnit ? ` · ${number(item.contentQuantity)} ${unitLabels[item.contentUnit]}` : '';
  return <View style={styles.productRow}>
    <View style={styles.productThumbEmpty}><Ionicons name="cube-outline" size={22} color={colors.cyan} /></View>
    <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{item.category ? `${item.category.name} · ` : ''}{number(item.quantity)} {unitLabels[item.unit]} em estoque{content}</Text><Text style={styles.productPrice}>{money(item.unitCost)}</Text></View>
    <View style={styles.rowActions}><Pressable onPress={onStock} accessibilityLabel={`Ajustar estoque de ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="layers-outline" size={18} color={colors.cyan} /></Pressable><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>
  </View>;
}

function BasketRow({ item, onEdit, onDelete }: { item: Basket; onEdit(): void; onDelete(): void }) {
  return <View style={styles.productRow}>
    <View style={styles.productThumbEmpty}><Ionicons name="gift-outline" size={22} color={colors.honey} /></View>
    <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{(item.products?.length || 0) + (item.materials?.length || 0)} componente(s)</Text><Text style={[styles.productPrice, item.status !== 'OK' && { color: colors.red }]}>Venda: {money(item.salePrice)}</Text></View>
    <View style={styles.rowActions}><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>
  </View>;
}



const styles = themedStyles((colors) => ({
  headerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  formLabel: { color: colors.ink, fontWeight: '600' },
  selector: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 12 },
  componentRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  check: { width: 34, height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.honey, borderColor: colors.honey },
  componentName: { flex: 1, color: colors.ink, fontWeight: '600' },
  componentPhoto: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSoft },
  componentPhotoFallback: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  quantityBox: { width: 82 },
  stockName: { color: colors.ink, fontWeight: '700', fontSize: 18, marginBottom: 5 },
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
  productRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  productThumb: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft },
  productThumbEmpty: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft, borderWidth: 1, borderColor: colors.border },
  productBody: { flex: 1 }, productName: { color: colors.ink, fontWeight: '700' }, productDetail: { color: colors.muted, fontSize: 12, marginTop: 4 }, productPrice: { color: colors.ink, fontWeight: '700', marginTop: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionButton: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  actionPressed: { opacity: 0.62, transform: [{ scale: 0.96 }] }
}));
