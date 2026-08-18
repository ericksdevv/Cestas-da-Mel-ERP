import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { Category, Material, MaterialInput, UnitOfMeasure } from '../../api/types';
import { Field, PrimaryButton, SectionTitle, SelectField, ErrorNotice } from '../../components/ui';
import { errorMessage, parseNumber, unitLabels } from '../../utils/format';
import { CategoryPicker } from './CategoryPicker';
import { themedStyles } from '../../theme/theme';

const units: UnitOfMeasure[] = ['UNIT', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'PACKAGE', 'BOX'];
const materialContentUnits: UnitOfMeasure[] = ['G', 'KG', 'ML', 'L', 'M', 'CM'];

export function MaterialForm({ item, categories, onSaved }: { item: Material | null; categories: Category[]; onSaved(): Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(item?.category?.id ?? null);
  const [hasContent, setHasContent] = useState(item?.contentQuantity ? 'yes' : 'no');
  const [contentQuantity, setContentQuantity] = useState(item?.contentQuantity ? String(item.contentQuantity) : '');
  const [contentUnit, setContentUnit] = useState<UnitOfMeasure>(item?.contentUnit ?? 'M');
  const [unit, setUnit] = useState<UnitOfMeasure>(item?.unit ?? 'UNIT');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [minimumStock, setMinimumStock] = useState(String(item?.minimumStock ?? 0));
  const [unitCost, setUnitCost] = useState(String(item?.unitCost ?? 0));
  const [active, setActive] = useState(item?.active === false ? 'no' : 'yes');

  const mutation = useMutation({ 
    mutationFn: (input: MaterialInput) => erpApi.saveMaterial(input, item?.id), 
    onSuccess: async () => { Alert.alert(item ? 'Material atualizado' : 'Material cadastrado', 'Os dados e o estoque foram salvos.'); await onSaved(); } 
  });

  const submit = () => {
    if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome do material.');
    const parsedContent = hasContent === 'yes' ? parseNumber(contentQuantity) : undefined;
    const input: MaterialInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId === null ? undefined : categoryId,
      contentQuantity: parsedContent,
      contentUnit: hasContent === 'yes' ? contentUnit : undefined,
      unit,
      quantity: parseNumber(quantity),
      minimumStock: parseNumber(minimumStock),
      unitCost: parseNumber(unitCost),
      active: active === 'yes'
    };
    if ([input.quantity, input.minimumStock, input.unitCost].some((value) => !Number.isFinite(value) || value < 0)) return Alert.alert('Valores inválidos', 'Revise a quantidade, o estoque mínimo e o custo.');
    if (hasContent === 'yes' && (!Number.isFinite(parsedContent) || !parsedContent || parsedContent <= 0)) return Alert.alert('Medida inválida', 'Informe a medida de uma unidade do material.');
    mutation.mutate(input);
  };

  return <><Field label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Fita decorativa" /><Field label="Descrição" value={description} onChangeText={setDescription} multiline /><CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} /><SectionTitle>Quantidade em estoque</SectionTitle><SelectField label="Como este material é controlado?" value={unit} options={units.map((entry) => ({ value: entry, label: unitLabels[entry] }))} onChange={(value) => setUnit(value as UnitOfMeasure)} /><Field label={`Quantidade disponível (${unitLabels[unit]})`} value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" placeholder="Ex.: 5,5" /><Text style={styles.helper}>Exemplo: para 5 metros de fita, selecione metro e informe 5. Para 2 kg de enchimento, selecione kg e informe 2.</Text><Field label={`Avisar quando restarem (${unitLabels[unit]})`} value={minimumStock} onChangeText={setMinimumStock} keyboardType="decimal-pad" /><SectionTitle>Medida de cada embalagem ou unidade</SectionTitle><SelectField label="Informar medida?" value={hasContent} options={[{ value: 'no', label: 'Não informar' }, { value: 'yes', label: 'Informar medida' }]} onChange={setHasContent} />{hasContent === 'yes' ? <><Field label="Medida de uma unidade" value={contentQuantity} onChangeText={setContentQuantity} keyboardType="decimal-pad" placeholder="Ex.: 10" /><SelectField label="Unidade da medida" value={contentUnit} options={materialContentUnits.map((entry) => ({ value: entry, label: unitLabels[entry] }))} onChange={(value) => setContentUnit(value as UnitOfMeasure)} /><Text style={styles.helper}>Exemplo: um rolo com 10 metros, um pacote com 500 g ou um frasco com 250 ml. Esta informação não altera a quantidade em estoque.</Text></> : null}<Field label={`Custo por ${unitLabels[unit]}`} value={unitCost} onChangeText={setUnitCost} keyboardType="decimal-pad" /><SelectField label="Situação" value={active} options={[{ value: 'yes', label: 'Ativo' }, { value: 'no', label: 'Inativo' }]} onChange={setActive} />{mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : item ? 'Atualizar material' : 'Cadastrar material'} onPress={submit} disabled={mutation.isPending} /></>;
}

const styles = themedStyles((colors) => ({
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
}));
