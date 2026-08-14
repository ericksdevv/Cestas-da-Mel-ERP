import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { authenticatedImageSource } from '../api/client';
import { erpApi } from '../api/erp';
import { Basket, BasketInput, Category, CategoryType, Material, MaterialInput, Product, ProductInput, UnitOfMeasure } from '../api/types';
import { Chips, Empty, ErrorNotice, Field, Header, ListRow, Loading, PrimaryButton, Screen, SecondaryButton, SectionTitle, Sheet, Tabs, uiStyles } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { errorMessage, money, number, parseNumber, unitLabels } from '../utils/format';
import { confirmAction } from '../utils/confirm';
import { chooseProductPhoto, PickedImage, takeProductPhoto } from '../native/imagePicker';

type CatalogTab = 'products' | 'materials' | 'baskets' | 'production';
type StockTarget = { kind: 'product'; item: Product } | { kind: 'material'; item: Material };
const units: UnitOfMeasure[] = ['UNIT', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'PACKAGE', 'BOX'];
const contentUnits: UnitOfMeasure[] = ['G', 'KG', 'ML', 'L'];
const materialContentUnits: UnitOfMeasure[] = ['G', 'KG', 'ML', 'L', 'M', 'CM'];

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
      {tab === 'production' && productions.data ? <CatalogList empty="Nenhuma produção registrada.">{productions.data.map((item) => <ListRow key={item.id} icon="construct-outline" title={`${number(item.quantity)} × ${item.basketName}`} subtitle={`${item.responsible} · ${new Date(item.producedAt).toLocaleString('pt-BR')}`} value={money(item.totalCost)} />)}</CatalogList> : null}

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
    {item.hasImage ? <Image source={authenticatedImageSource(`/products/${item.id}/image`)} style={styles.productThumb} /> : <View style={styles.productThumbEmpty}><Ionicons name="pricetag-outline" size={22} color={colors.cyan} /></View>}
    <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{item.category ? `${item.category.name} · ` : ''}{number(item.quantity)} un. em estoque{content}</Text><Text style={[styles.productPrice, item.status !== 'OK' && { color: colors.red }]}>{money(item.salePrice)}</Text></View>
    <View style={styles.rowActions}><Pressable onPress={onStock} accessibilityLabel={`Ajustar estoque de ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="layers-outline" size={18} color={colors.cyan} /></Pressable><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>
  </View>;
}

function MaterialRow({ item, onEdit, onStock, onDelete }: { item: Material; onEdit(): void; onStock(): void; onDelete(): void }) {
  const content = item.contentQuantity && item.contentUnit ? ` · cada item: ${number(item.contentQuantity)} ${unitLabels[item.contentUnit]}` : '';
  return <View style={styles.productRow}><View style={styles.productThumbEmpty}><Ionicons name="albums-outline" size={22} color={colors.violet} /></View><View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{item.category ? `${item.category.name} · ` : ''}{number(item.quantity)} {unitLabels[item.unit]} em estoque{content}</Text><Text style={[styles.productPrice, item.status !== 'OK' && { color: colors.red }]}>{money(item.unitCost)}</Text></View><View style={styles.rowActions}><Pressable onPress={onStock} accessibilityLabel={`Ajustar estoque de ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="layers-outline" size={18} color={colors.cyan} /></Pressable><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View></View>;
}

function BasketRow({ item, onEdit, onDelete }: { item: Basket; onEdit(): void; onDelete(): void }) {
  return <View style={styles.productRow}><View style={styles.productThumbEmpty}><Ionicons name="gift-outline" size={22} color={colors.honey} /></View><View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productDetail}>{number(item.quantity)} prontas · produz até {number(item.maximumProducible)} · {item.products.length + item.materials.length} componentes</Text><Text style={[styles.productPrice, item.status !== 'OK' && { color: colors.red }]}>{money(item.salePrice)}</Text></View><View style={styles.rowActions}><Pressable onPress={onEdit} accessibilityLabel={`Editar ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="create-outline" size={19} color={colors.ink} /></Pressable><Pressable onPress={onDelete} accessibilityLabel={`Excluir ${item.name}`} hitSlop={7} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View></View>;
}

function ProductForm({ item, categories, onSaved }: { item: Product | null; categories: Category[]; onSaved(): Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState(item?.category ? String(item.category.id) : 'none');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock ?? 0));
  const [hasContent, setHasContent] = useState(item?.contentQuantity ? 'yes' : 'no');
  const [contentQuantity, setContentQuantity] = useState(item?.contentQuantity ? String(item.contentQuantity) : '');
  const [contentUnit, setContentUnit] = useState<UnitOfMeasure>(item?.contentUnit ?? 'G');
  const [purchasePrice, setPurchasePrice] = useState(String(item?.purchasePrice ?? 0));
  const [salePrice, setSalePrice] = useState(String(item?.salePrice ?? 0));
  const [active, setActive] = useState(item?.active === false ? 'no' : 'yes');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const mutation = useMutation({
    mutationFn: async (input: ProductInput) => {
      const saved = await erpApi.saveProduct(input, item?.id);
      if (photo) {
        const form = new FormData();
        if (photo.file) form.append('file', photo.file, photo.fileName);
        else form.append('file', { uri: photo.uri, name: photo.fileName, type: photo.mimeType } as unknown as Blob);
        return erpApi.uploadProductImage(saved.id, form);
      }
      if (removePhoto && saved.hasImage) {
        await erpApi.deleteProductImage(saved.id);
        return { ...saved, hasImage: false };
      }
      return saved;
    },
    onSuccess: async () => { Alert.alert(item ? 'Produto atualizado' : 'Produto cadastrado', 'Produto e estoque salvos com sucesso.'); await onSaved(); },
  });
  const selectPhoto = async (camera: boolean) => {
    try {
      const selected = camera ? await takeProductPhoto() : await chooseProductPhoto();
      if (selected) { setPhoto(selected); setRemovePhoto(false); }
    } catch (cause) { Alert.alert('Não foi possível abrir a imagem', errorMessage(cause)); }
  };
  const submit = () => {
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome do produto.');
    const parsedContent = hasContent === 'yes' ? parseNumber(contentQuantity) : undefined;
    const input: ProductInput = { name: name.trim(), description: description.trim(), categoryId: categoryId === 'none' ? undefined : Number(categoryId), contentQuantity: parsedContent, contentUnit: hasContent === 'yes' ? contentUnit : undefined, quantity: parseNumber(quantity), minimumStock: parseNumber(minimumStock), purchasePrice: parseNumber(purchasePrice), salePrice: parseNumber(salePrice), active: active === 'yes' };
    if (![input.quantity, input.minimumStock].every(Number.isInteger)) return Alert.alert('Estoque em unidades', 'A quantidade e o estoque mínimo devem ser números inteiros.');
    if ([input.quantity, input.minimumStock, input.purchasePrice, input.salePrice].some((value) => !Number.isFinite(value) || value < 0) || (hasContent === 'yes' && (!Number.isFinite(parsedContent) || !parsedContent || parsedContent <= 0))) return Alert.alert('Valores inválidos', 'Revise estoque, conteúdo e preços.');
    mutation.mutate(input);
  };
  const preview = photo ? { uri: photo.uri } : item?.hasImage && !removePhoto ? authenticatedImageSource(`/products/${item.id}/image`) : null;
  return <>
    <View style={styles.photoArea}>{preview ? <Image source={preview} style={styles.photoPreview} /> : <View style={styles.photoEmpty}><Ionicons name="image-outline" size={34} color={colors.cyan} /><Text style={styles.helper}>Foto opcional do produto</Text></View>}<View style={styles.photoActions}><SecondaryButton title="Tirar foto" icon="camera-outline" onPress={() => void selectPhoto(true)} compact /><SecondaryButton title="Galeria" icon="images-outline" onPress={() => void selectPhoto(false)} compact />{preview ? <SecondaryButton title="Remover" icon="trash-outline" danger onPress={() => { setPhoto(null); setRemovePhoto(true); }} compact /> : null}</View></View>
    <Field label="Nome do produto" value={name} onChangeText={setName} placeholder="Ex.: Perfume Floral" />
    <Field label="Descrição" value={description} onChangeText={setDescription} multiline />
    <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
    <SectionTitle>Estoque</SectionTitle>
    <Field label="Quantidade disponível (unidades)" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Ex.: 5" />
    <Text style={styles.helper}>Exemplo: 5 perfumes significam 5 unidades disponíveis.</Text>
    <Field label="Avisar quando restarem (unidades)" value={minimumStock} onChangeText={setMinimumStock} keyboardType="number-pad" />
    <SectionTitle>Conteúdo da embalagem</SectionTitle>
    <Chips values={['no', 'yes'] as const} value={hasContent} labels={{ no: 'Não informar', yes: 'Informar peso/volume' }} onChange={setHasContent} />
    {hasContent === 'yes' ? <><Field label="Peso ou volume de uma unidade" value={contentQuantity} onChangeText={setContentQuantity} keyboardType="decimal-pad" placeholder="Ex.: 100" /><Chips values={contentUnits} value={contentUnit} labels={unitLabels} onChange={setContentUnit} /><Text style={styles.helper}>Exemplo: perfume de 100 ml ou chocolate de 90 g. Isso não altera o estoque.</Text></> : null}
    <Field label="Preço de compra por unidade" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
    <Field label="Preço de venda por unidade" value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" />
    <Text style={styles.formLabel}>Situação</Text><Chips values={['yes', 'no'] as const} value={active} labels={{ yes: 'Ativo', no: 'Inativo' }} onChange={setActive} />
    {mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : item ? 'Atualizar produto' : 'Cadastrar produto'} onPress={submit} disabled={mutation.isPending} />
  </>;
}

function MaterialForm({ item, categories, onSaved }: { item: Material | null; categories: Category[]; onSaved(): Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState(item?.category ? String(item.category.id) : 'none');
  const [hasContent, setHasContent] = useState(item?.contentQuantity ? 'yes' : 'no');
  const [contentQuantity, setContentQuantity] = useState(item?.contentQuantity ? String(item.contentQuantity) : '');
  const [contentUnit, setContentUnit] = useState<UnitOfMeasure>(item?.contentUnit ?? 'M');
  const [unit, setUnit] = useState<UnitOfMeasure>(item?.unit ?? 'UNIT');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock ?? 0));
  const [unitCost, setUnitCost] = useState(String(item?.unitCost ?? 0));
  const [active, setActive] = useState(item?.active === false ? 'no' : 'yes');
  const mutation = useMutation({ mutationFn: (input: MaterialInput) => erpApi.saveMaterial(input, item?.id), onSuccess: async () => { Alert.alert(item ? 'Material atualizado' : 'Material cadastrado', 'Os dados e o estoque foram salvos.'); await onSaved(); } });
  const submit = () => {
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome do material.');
    const parsedContent = hasContent === 'yes' ? parseNumber(contentQuantity) : undefined;
    const input: MaterialInput = { name: name.trim(), description: description.trim(), categoryId: categoryId === 'none' ? undefined : Number(categoryId), contentQuantity: parsedContent, contentUnit: hasContent === 'yes' ? contentUnit : undefined, unit, quantity: parseNumber(quantity), minimumStock: parseNumber(minimumStock), unitCost: parseNumber(unitCost), active: active === 'yes' };
    if ([input.quantity, input.minimumStock, input.unitCost].some((value) => !Number.isFinite(value) || value < 0)) return Alert.alert('Valores inválidos', 'Revise a quantidade, o estoque mínimo e o custo.');
    if (hasContent === 'yes' && (!Number.isFinite(parsedContent) || !parsedContent || parsedContent <= 0)) return Alert.alert('Medida inválida', 'Informe a medida de uma unidade do material.');
    mutation.mutate(input);
  };
  return <><Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Fita decorativa" /><Field label="Descrição" value={description} onChangeText={setDescription} multiline /><CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} /><SectionTitle>Quantidade em estoque</SectionTitle><Text style={styles.formLabel}>Como este material é controlado?</Text><Chips values={units} value={unit} labels={unitLabels} onChange={setUnit} /><Field label={`Quantidade disponível (${unitLabels[unit]})`} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="Ex.: 5,5" /><Text style={styles.helper}>Exemplo: para 5 metros de fita, selecione metro e informe 5. Para 2 kg de enchimento, selecione kg e informe 2.</Text><Field label={`Avisar quando restarem (${unitLabels[unit]})`} value={minimumStock} onChangeText={setMinimumStock} keyboardType="decimal-pad" /><SectionTitle>Medida de cada embalagem ou unidade</SectionTitle><Chips values={['no', 'yes'] as const} value={hasContent} labels={{ no: 'Não informar', yes: 'Informar medida' }} onChange={setHasContent} />{hasContent === 'yes' ? <><Field label="Medida de uma unidade" value={contentQuantity} onChangeText={setContentQuantity} keyboardType="decimal-pad" placeholder="Ex.: 10" /><Chips values={materialContentUnits} value={contentUnit} labels={unitLabels} onChange={setContentUnit} /><Text style={styles.helper}>Exemplo: um rolo com 10 metros, um pacote com 500 g ou um frasco com 250 ml. Esta informação não altera a quantidade em estoque.</Text></> : null}<Field label={`Custo por ${unitLabels[unit]}`} value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad" /><Text style={styles.formLabel}>Situação</Text><Chips values={['yes', 'no'] as const} value={active} labels={{ yes: 'Ativo', no: 'Inativo' }} onChange={setActive} />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : item ? 'Atualizar material' : 'Cadastrar material'} onPress={submit} disabled={mutation.isPending} /></>;
}

function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: string; onChange(value: string): void }) {
  const values = ['none', ...categories.map(item => String(item.id))];
  const labels = { none: 'Sem categoria', ...Object.fromEntries(categories.map(item => [String(item.id), item.name])) };
  return <><Text style={styles.formLabel}>Categoria</Text><Chips values={values} value={value} labels={labels} onChange={onChange} />{!categories.length ? <Text style={styles.helper}>Crie categorias pelo ícone de pasta na tela de estoque.</Text> : null}</>;
}

function CategoryManager({ type, categories, onChanged }: { type: CategoryType; categories: Category[]; onChanged(): Promise<void> }) {
  const [name, setName] = useState('');
  const create = useMutation({ mutationFn: () => erpApi.saveCategory({ name: name.trim(), type }), onSuccess: async () => { setName(''); await onChanged(); } });
  const remove = useMutation({ mutationFn: (id: number) => erpApi.deleteCategory(id), onSuccess: onChanged });
  const submit = () => { if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome da categoria.'); create.mutate(); };
  const requestRemove = (item: Category) => confirmAction(`Excluir ${item.name}?`, 'A categoria só poderá ser excluída se não estiver sendo usada.', () => remove.mutate(item.id));
  const error = create.error ?? remove.error;
  return <><Text style={styles.helper}>As categorias ficam salvas no banco e podem ser selecionadas nos novos cadastros.</Text><View style={styles.categoryCreate}><View style={uiStyles.grow}><Field label="Nova categoria" value={name} onChangeText={setName} placeholder={type === 'PRODUCT' ? 'Ex.: Perfumes' : 'Ex.: Embalagens'} onSubmitEditing={submit} /></View><PrimaryButton title="Criar" icon="add" onPress={submit} disabled={create.isPending} compact /></View>{error ? <ErrorNotice message={errorMessage(error)} /> : null}{!categories.length ? <Empty message="Nenhuma categoria criada." /> : <View style={styles.categoryList}>{categories.map(item => <View key={item.id} style={styles.categoryRow}><View style={styles.categoryIcon}><Ionicons name="folder-outline" size={18} color={colors.cyan} /></View><Text style={styles.categoryName}>{item.name}</Text><Pressable onPress={() => requestRemove(item)} accessibilityLabel={`Excluir categoria ${item.name}`} style={({ pressed }) => [styles.iconOnly, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>)}</View>}</>;
}

function BasketForm({ item, products, materials, onSaved }: { item: Basket | null; products: Product[]; materials: Material[]; onSaved(): Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [salePrice, setSalePrice] = useState(String(item?.salePrice ?? 0));
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock ?? 0));
  const [active, setActive] = useState(item?.active === false ? 'no' : 'yes');
  const initialProducts = useMemo(() => Object.fromEntries((item?.products ?? []).map((entry) => [entry.id, String(entry.quantity)])), [item]);
  const initialMaterials = useMemo(() => Object.fromEntries((item?.materials ?? []).map((entry) => [entry.id, String(entry.quantity)])), [item]);
  const [selectedProducts, setSelectedProducts] = useState<Record<number, string>>(initialProducts);
  const [selectedMaterials, setSelectedMaterials] = useState<Record<number, string>>(initialMaterials);
  const mutation = useMutation({ mutationFn: (input: BasketInput) => erpApi.saveBasket(input, item?.id), onSuccess: onSaved });
  const toggle = (id: number, values: Record<number, string>, setter: (value: Record<number, string>) => void) => { const next = { ...values }; if (next[id]) delete next[id]; else next[id] = '1'; setter(next); };
  const submit = () => {
    const price = parseNumber(salePrice);
    const basketProducts = Object.entries(selectedProducts).map(([id, quantity]) => ({ id: Number(id), quantity: parseNumber(quantity) }));
    const basketMaterials = Object.entries(selectedMaterials).map(([id, quantity]) => ({ id: Number(id), quantity: parseNumber(quantity) }));
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome da cesta.');
    if (!Number.isFinite(price) || price < 0 || [...basketProducts, ...basketMaterials].some((entry) => !Number.isFinite(entry.quantity) || entry.quantity <= 0)) return Alert.alert('Valores inválidos', 'Revise o preço e as quantidades dos componentes.');
    mutation.mutate({ name: name.trim(), description: description.trim(), salePrice: price, minimumStock: parseNumber(minimumStock), active: active === 'yes', products: basketProducts, materials: basketMaterials });
  };
  return <><Field label="Nome da cesta" value={name} onChangeText={setName} /><Field label="Descrição" value={description} onChangeText={setDescription} multiline /><Field label="Preço de venda" value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" /><Field label="Estoque mínimo de cestas prontas" value={minimumStock} onChangeText={setMinimumStock} keyboardType="decimal-pad" /><Text style={styles.formLabel}>Situação</Text><Chips values={['yes', 'no'] as const} value={active} labels={{ yes: 'Ativa', no: 'Inativa' }} onChange={setActive} /><SectionTitle>Produtos da cesta</SectionTitle><ComponentSelector items={products} selected={selectedProducts} onToggle={(id) => toggle(id, selectedProducts, setSelectedProducts)} onQuantity={(id, value) => setSelectedProducts((current) => ({ ...current, [id]: value }))} /><SectionTitle>Materiais da cesta</SectionTitle><ComponentSelector items={materials} selected={selectedMaterials} onToggle={(id) => toggle(id, selectedMaterials, setSelectedMaterials)} onQuantity={(id, value) => setSelectedMaterials((current) => ({ ...current, [id]: value }))} />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : 'Salvar modelo'} onPress={submit} disabled={mutation.isPending} /></>;
}

function ProductionForm({ baskets, onSaved }: { baskets: Basket[]; onSaved(): Promise<void> }) {
  const [basketId, setBasketId] = useState(String(baskets.find(item => item.active)?.id ?? ''));
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const selected = baskets.find(item => String(item.id) === basketId);
  const mutation = useMutation({ mutationFn: () => erpApi.createProduction({ basketId: Number(basketId), quantity: parseNumber(quantity), producedAt: new Date().toISOString(), notes: notes.trim() }), onSuccess: onSaved });
  const submit = () => { const amount=parseNumber(quantity); if(!selected)return Alert.alert('Selecione um modelo'); if(!Number.isInteger(amount)||amount<=0)return Alert.alert('Quantidade inválida','Informe uma quantidade inteira maior que zero.'); if(amount>selected.maximumProducible)return Alert.alert('Componentes insuficientes',`É possível produzir no máximo ${number(selected.maximumProducible)} cesta(s).`); mutation.mutate(); };
  if(!baskets.length)return <Empty message="Cadastre um modelo de cesta primeiro."/>;
  return <><Text style={styles.formLabel}>Modelo</Text><Chips values={baskets.filter(item=>item.active).map(item=>String(item.id))} value={basketId} labels={Object.fromEntries(baskets.map(item=>[String(item.id),item.name]))} onChange={setBasketId}/>{selected?<View style={uiStyles.panel}><Text style={styles.stockName}>{selected.name}</Text><Text style={uiStyles.muted}>Prontas: {number(selected.quantity)} · máximo produzível agora: {number(selected.maximumProducible)}</Text></View>:null}<Field label="Quantidade a produzir" value={quantity} onChangeText={setQuantity} keyboardType="number-pad"/><Field label="Observações" value={notes} onChangeText={setNotes} multiline/>{mutation.error?<ErrorNotice message={errorMessage(mutation.error)}/>:null}<PrimaryButton title={mutation.isPending?'Produzindo...':'Confirmar produção'} onPress={submit} disabled={mutation.isPending}/></>;
}

function ComponentSelector({ items, selected, onToggle, onQuantity }: { items: (Product | Material)[]; selected: Record<number, string>; onToggle(id: number): void; onQuantity(id: number, value: string): void }) {
  if (!items.length) return <Empty message="Cadastre os itens antes de montar a cesta." />;
  return <View style={styles.selector}>{items.filter((item) => item.active).map((item) => <View key={item.id} style={styles.componentRow}><Pressable onPress={() => onToggle(item.id)} style={[styles.check, selected[item.id] && styles.checkActive]}><Ionicons name={selected[item.id] ? 'checkmark' : 'add'} size={18} color={selected[item.id] ? colors.honeyInk : colors.muted} /></Pressable><Text style={styles.componentName}>{item.name}</Text>{selected[item.id] ? <View style={styles.quantityBox}><Field label="Qtd." value={selected[item.id]} onChangeText={(value) => onQuantity(item.id, value)} keyboardType="decimal-pad" /></View> : null}</View>)}</View>;
}

function StockForm({ target, onSaved }: { target: StockTarget; onSaved(): Promise<void> }) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>(target.item.unit);
  const [notes, setNotes] = useState('');
  const mutation = useMutation({ mutationFn: async () => target.kind === 'product' ? erpApi.adjustProduct(target.item.id, parseNumber(quantity), notes.trim(), unit) : erpApi.adjustMaterial(target.item.id, parseNumber(quantity), notes.trim(), unit), onSuccess: onSaved });
  const submit = () => {
    const parsed = parseNumber(quantity);
    if (!Number.isFinite(parsed) || parsed === 0) return Alert.alert('Quantidade inválida', 'Use valor positivo para adicionar ou negativo para retirar.');
    if (!notes.trim()) return Alert.alert('Motivo obrigatório', 'Informe o motivo do ajuste.');
    mutation.mutate();
  };
  const compatible = target.item.unit === 'KG' || target.item.unit === 'G' ? ['KG', 'G'] as const : target.item.unit === 'L' || target.item.unit === 'ML' ? ['L', 'ML'] as const : target.item.unit === 'M' || target.item.unit === 'CM' ? ['M', 'CM'] as const : [target.item.unit];
  return <><View style={uiStyles.panel}><Text style={styles.stockName}>{target.item.name}</Text><Text style={uiStyles.muted}>Quantidade em estoque: {number(target.item.quantity)} {unitLabels[target.item.unit]}</Text></View><Field label="Quantidade do ajuste" value={quantity} onChangeText={setQuantity} keyboardType="numbers-and-punctuation" placeholder="Ex.: 10 ou -2" />{compatible.length > 1 ? <><Text style={styles.formLabel}>Unidade informada</Text><Chips values={[...compatible]} value={unit} labels={unitLabels} onChange={setUnit} /></> : null}<Field label="Motivo" value={notes} onChangeText={setNotes} multiline placeholder="Ex.: Recontagem do estoque" />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Ajustando...' : 'Confirmar ajuste'} onPress={submit} disabled={mutation.isPending} /></>;
}

const styles = themedStyles((colors) => ({
  headerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  formLabel: { color: colors.ink, fontWeight: '600' },
  selector: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 12 },
  componentRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  check: { width: 34, height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.honey, borderColor: colors.honey },
  componentName: { flex: 1, color: colors.ink, fontWeight: '600' },
  quantityBox: { width: 82 },
  stockName: { color: colors.ink, fontWeight: '700', fontSize: 18, marginBottom: 5 },
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
  productRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  productThumb: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surfaceSoft },
  productThumbEmpty: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft, borderWidth: 1, borderColor: colors.border },
  productBody: { flex: 1 }, productName: { color: colors.ink, fontWeight: '700' }, productDetail: { color: colors.muted, fontSize: 12, marginTop: 4 }, productPrice: { color: colors.ink, fontWeight: '700', marginTop: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  actionButton: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  actionPressed: { opacity: 0.62, transform: [{ scale: 0.96 }] },
  photoArea: { alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surfaceGlass },
  photoPreview: { width: 150, height: 150, borderRadius: 24, backgroundColor: colors.surfaceSoft },
  photoEmpty: { width: 150, height: 130, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  photoActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  categoryCreate: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 }, categoryList: { borderTopWidth: 1, borderTopColor: colors.border }, categoryRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, categoryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft }, categoryName: { flex: 1, color: colors.ink, fontWeight: '600' }, iconOnly: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
}));
