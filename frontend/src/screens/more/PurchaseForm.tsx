import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View, StyleSheet } from 'react-native';
import { erpApi } from '../../api/erp';
import { Material, Product, PurchaseInput, UnitOfMeasure } from '../../api/types';
import { Field, Loading, PrimaryButton, SelectField, ErrorNotice } from '../../components/ui';
import { ProductImage } from '../../components/ProductImage';
import { colors, themedStyles } from '../../theme/theme';
import { number, parseNumber, unitLabels, errorMessage } from '../../utils/format';

type PurchaseSelection = Record<string, { type: 'PRODUCT' | 'MATERIAL'; id: number; name: string; quantity: string; unit: UnitOfMeasure; unitCost: string }>;

export function PurchaseForm({ onDone }: { onDone(): void }) {
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

  const toggle = (type: 'PRODUCT' | 'MATERIAL', item: Product | Material, cost: number) => setSelection((current) => { 
    const key = `${type}:${item.id}`; 
    const next = { ...current }; 
    if (next[key]) delete next[key]; 
    else next[key] = { type, id: item.id, name: item.name, quantity: '1', unit: item.unit, unitCost: String(cost) }; 
    return next; 
  });

  const update = (key: string, field: 'quantity' | 'unitCost' | 'unit', value: string) => 
    setSelection((current) => ({ ...current, [key]: { ...current[key], [field]: value } }));

  const mutation = useMutation({ 
    mutationFn: (input: PurchaseInput) => erpApi.createPurchase(input), 
    onSuccess: () => { 
      onDone(); 
      void Promise.all(['purchases', 'products', 'materials', 'dashboard', 'transactions', 'balance', 'alerts', 'stock-movements', 'material-movements']
        .map((key) => queryClient.invalidateQueries({ queryKey: [key] }))); 
    } 
  });

  const submit = () => {
    const lines = Object.values(selection).map((item) => ({ type: item.type, referenceId: item.id, quantity: parseNumber(item.quantity), unit: item.unit, unitCost: parseNumber(item.unitCost) }));
    if (!establishment.trim()) return Alert.alert('Estabelecimento obrigatório');
    if (!lines.length || lines.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitCost) || item.unitCost < 0)) 
      return Alert.alert('Itens inválidos', 'Selecione ao menos um item e revise quantidade e custo.');
    mutation.mutate({ establishment: establishment.trim(), purchasedAt: new Date().toISOString(), observations: observations.trim(), items: lines });
  };



  return (
    <>
      <Field label="Estabelecimento" value={establishment} onChangeText={setEstablishment} placeholder="Ex.: Atacadista Central" />
      <Field label="Observações" value={observations} onChangeText={setObservations} multiline />
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <Text style={styles.formTitle}>Itens comprados</Text>
      </View>

      {products.isLoading || materials.isLoading ? <Loading /> : 
        <View style={styles.purchaseItems}>
          {items.map(({ type, item, cost }) => { 
            const key = `${type}:${item.id}`; 
            const selected = selection[key]; 
            const units = compatibleUnits(item.unit); 
            const product = type === 'PRODUCT' ? item as Product : null; 
            
            return (
              <View key={key} style={styles.purchaseItem}>
                <Pressable onPress={() => toggle(type, item, cost)} style={[styles.check, selected && styles.checkActive]}>
                  <Ionicons name={selected ? 'checkmark' : 'add'} size={18} color={selected ? colors.honeyInk : colors.muted} />
                </Pressable>
                
                {product ? 
                  <ProductImage productId={product.id} hasImage={product.hasImage} imageVersion={product.imageVersion} style={styles.purchasePhoto} fallback={<View style={styles.purchasePhotoFallback}><Ionicons name="pricetag-outline" size={17} color={colors.cyan} /></View>} /> 
                : null}
                
                <View style={styles.purchaseBody}>
                  <Text style={styles.purchaseName}>{item.name}</Text>
                  <Text style={styles.purchaseType}>{type === 'PRODUCT' ? 'Produto' : 'Material'} · {number(item.quantity)} {unitLabels[item.unit]}</Text>
                  
                  {selected ? (
                    <>
                      <View style={styles.purchaseFields}>
                        <View style={styles.purchaseField}>
                          <Field label="Quantidade" value={selected.quantity} onChangeText={(value) => update(key, 'quantity', value)} keyboardType="decimal-pad" />
                        </View>
                        <View style={styles.purchaseField}>
                          <Field label={`Custo por ${unitLabels[selected.unit]}`} value={selected.unitCost} onChangeText={(value) => update(key, 'unitCost', value)} keyboardType="decimal-pad" />
                        </View>
                      </View>
                      {units.length > 1 ? 
                        <SelectField label="Unidade informada" value={selected.unit} options={units.map((unit) => ({ value: unit, label: unitLabels[unit] }))} onChange={(unit) => update(key, 'unit', unit as UnitOfMeasure)} /> 
                      : null}
                    </>
                  ) : null}
                </View>
              </View>
            ); 
          })}
        </View>
      }
      
      {mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}
      <PrimaryButton title={mutation.isPending ? 'Registrando...' : 'Registrar compra'} onPress={submit} disabled={mutation.isPending} />
    </>
  );
}

const compatibleUnits = (unit: UnitOfMeasure): UnitOfMeasure[] => unit === 'KG' || unit === 'G' ? ['KG', 'G'] : unit === 'L' || unit === 'ML' ? ['L', 'ML'] : unit === 'M' || unit === 'CM' ? ['M', 'CM'] : [unit];

const styles = themedStyles((colors) => ({
  formTitle: { color: colors.ink, fontWeight: '700', fontSize: 17 },
  purchaseItems: { paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  purchaseItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  check: { width: 35, height: 35, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  purchasePhoto: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.surfaceSoft },
  purchasePhotoFallback: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft },
  purchaseBody: { flex: 1 },
  purchaseName: { color: colors.ink, fontWeight: '600' },
  purchaseType: { color: colors.muted, fontSize: 12, marginTop: 3 },
  purchaseFields: { flexDirection: 'row', gap: 8, marginTop: 10 },
  purchaseField: { flex: 1 },
}));
