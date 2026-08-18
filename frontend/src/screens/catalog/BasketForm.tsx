import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { Basket, BasketInput, Material, Product } from '../../api/types';
import { Field, PrimaryButton, SectionTitle, SelectField, ErrorNotice, Empty } from '../../components/ui';
import { ProductImage } from '../../components/ProductImage';
import { errorMessage, parseNumber } from '../../utils/format';
import { colors, themedStyles } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export function BasketForm({ item, products, materials, onSaved }: { item: Basket | null; products: Product[]; materials: Material[]; onSaved(): Promise<void> }) {
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
  
  const toggle = (id: number, values: Record<number, string>, setter: (value: Record<number, string>) => void) => { 
    const next = { ...values }; 
    if (next[id]) delete next[id]; else next[id] = '1'; 
    setter(next); 
  };
  
  const submit = () => {
    const price = parseNumber(salePrice);
    const basketProducts = Object.entries(selectedProducts).map(([id, quantity]) => ({ id: Number(id), quantity: parseNumber(quantity) }));
    const basketMaterials = Object.entries(selectedMaterials).map(([id, quantity]) => ({ id: Number(id), quantity: parseNumber(quantity) }));
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome da cesta.');
    if (!Number.isFinite(price) || price < 0 || [...basketProducts, ...basketMaterials].some((entry) => !Number.isFinite(entry.quantity) || entry.quantity <= 0)) return Alert.alert('Valores inválidos', 'Revise o preço e as quantidades dos componentes.');
    mutation.mutate({ name: name.trim(), description: description.trim(), salePrice: price, minimumStock: parseNumber(minimumStock), active: active === 'yes', products: basketProducts, materials: basketMaterials });
  };
  
  return <><Field label="Nome da cesta" value={name} onChangeText={setName} /><Field label="Descrição" value={description} onChangeText={setDescription} multiline /><Field label="Preço de venda" value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" /><Field label="Estoque mínimo de cestas prontas" value={minimumStock} onChangeText={setMinimumStock} keyboardType="decimal-pad" /><SelectField label="Situação" value={active} options={[{ value: 'yes', label: 'Ativa' }, { value: 'no', label: 'Inativa' }]} onChange={setActive} /><SectionTitle>Produtos da cesta</SectionTitle><ComponentSelector items={products} selected={selectedProducts} onToggle={(id) => toggle(id, selectedProducts, setSelectedProducts)} onQuantity={(id, value) => setSelectedProducts((current) => ({ ...current, [id]: value }))} /><SectionTitle>Materiais da cesta</SectionTitle><ComponentSelector items={materials} selected={selectedMaterials} onToggle={(id) => toggle(id, selectedMaterials, setSelectedMaterials)} onQuantity={(id, value) => setSelectedMaterials((current) => ({ ...current, [id]: value }))} />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : 'Salvar modelo'} onPress={submit} disabled={mutation.isPending} /></>;
}

function ComponentSelector({ items, selected, onToggle, onQuantity }: { items: (Product | Material)[]; selected: Record<number, string>; onToggle(id: number): void; onQuantity(id: number, value: string): void }) {
  if (!items.length) return <Empty message="Cadastre os itens antes de montar a cesta." />;
  return <View style={styles.selector}>{items.filter((item) => item.active).map((item) => { 
    const product = 'hasImage' in item ? item : null; 
    return <View key={item.id} style={styles.componentRow}>
      <Pressable onPress={() => onToggle(item.id)} style={[styles.check, selected[item.id] && styles.checkActive]}>
        <Ionicons name={selected[item.id] ? 'checkmark' : 'add'} size={18} color={selected[item.id] ? colors.honeyInk : colors.muted} />
      </Pressable>
      {product ? <ProductImage productId={product.id} hasImage={product.hasImage} imageVersion={product.imageVersion} style={styles.componentPhoto} fallback={<View style={styles.componentPhotoFallback}><Ionicons name="pricetag-outline" size={17} color={colors.cyan} /></View>} /> : null}
      <Text style={styles.componentName}>{item.name}</Text>
      {selected[item.id] ? <View style={styles.quantityBox}><Field label="Qtd." value={selected[item.id]} onChangeText={(value) => onQuantity(item.id, value)} keyboardType="decimal-pad" /></View> : null}
    </View>; 
  })}</View>;
}

const styles = themedStyles((colors) => ({
  selector: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 12 },
  componentRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8 },
  check: { width: 34, height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.honey, borderColor: colors.honey },
  componentName: { flex: 1, color: colors.ink, fontWeight: '600' },
  componentPhoto: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceSoft },
  componentPhotoFallback: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  quantityBox: { width: 82 },
}));
