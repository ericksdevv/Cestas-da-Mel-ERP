import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { UnitOfMeasure, Product, Material } from '../../api/types';
import { Field, PrimaryButton, SelectField, ErrorNotice, uiStyles } from '../../components/ui';
import { errorMessage, number, parseNumber, unitLabels } from '../../utils/format';
import { themedStyles } from '../../theme/theme';

export type StockTarget = { kind: 'product'; item: Product } | { kind: 'material'; item: Material };

export function StockForm({ target, onSaved }: { target: StockTarget; onSaved(): Promise<void> }) {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>(target.item.unit);
  const [notes, setNotes] = useState('');
  
  const mutation = useMutation({ 
    mutationFn: async () => target.kind === 'product' ? erpApi.adjustProduct(target.item.id, parseNumber(quantity), notes.trim(), unit) : erpApi.adjustMaterial(target.item.id, parseNumber(quantity), notes.trim(), unit), 
    onSuccess: onSaved 
  });
  
  const submit = () => {
    const parsed = parseNumber(quantity);
    if (!Number.isFinite(parsed) || parsed === 0) return Alert.alert('Quantidade inválida', 'Use valor positivo para adicionar ou negativo para retirar.');
    if (!notes.trim()) return Alert.alert('Motivo obrigatório', 'Informe o motivo do ajuste.');
    mutation.mutate();
  };
  
  
  const compatible = target.item.unit === 'KG' || target.item.unit === 'G' ? ['KG', 'G'] as const : target.item.unit === 'L' || target.item.unit === 'ML' ? ['L', 'ML'] as const : target.item.unit === 'M' || target.item.unit === 'CM' ? ['M', 'CM'] as const : [target.item.unit];
  
  return <><View style={uiStyles.panel}><Text style={styles.stockName}>{target.item.name}</Text><Text style={uiStyles.muted}>Quantidade em estoque: {number(target.item.quantity)} {unitLabels[target.item.unit]}</Text></View><Field label="Quantidade do ajuste" value={quantity} onChangeText={setQuantity} keyboardType="numbers-and-punctuation" placeholder="Ex.: 10 ou -2" />{compatible.length > 1 ? <SelectField label="Unidade informada" value={unit} options={compatible.map((entry) => ({ value: entry, label: unitLabels[entry] }))} onChange={(value) => setUnit(value as UnitOfMeasure)} /> : null}<Field label="Motivo" value={notes} onChangeText={setNotes} multiline placeholder="Ex.: Recontagem do estoque" />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Ajustando...' : 'Confirmar ajuste'} onPress={submit} disabled={mutation.isPending} /></>;
}

const styles = themedStyles((colors) => ({
  stockName: { color: colors.ink, fontWeight: '700', fontSize: 18, marginBottom: 8 },
}));
