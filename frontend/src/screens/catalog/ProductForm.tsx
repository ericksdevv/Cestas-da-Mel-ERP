import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Image, View, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { Category, Product, ProductInput, UnitOfMeasure } from '../../api/types';
import { Field, PrimaryButton, SecondaryButton, SectionTitle, SelectField, ErrorNotice } from '../../components/ui';
import { ProductImage } from '../../components/ProductImage';
import { PickedImage, chooseProductPhoto, takeProductPhoto } from '../../native/imagePicker';
import { parseNumber, errorMessage, unitLabels } from '../../utils/format';
import { CategoryPicker } from './CategoryPicker';
import { colors, themedStyles } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const contentUnits: UnitOfMeasure[] = ['G', 'KG', 'ML', 'L'];

function PhotoPlaceholder() {
  return <View style={styles.photoEmpty}><Ionicons name="image-outline" size={34} color={colors.cyan} /><Text style={styles.helper}>Foto opcional do produto</Text></View>;
}

export function ProductForm({ item, categories, onSaved }: { item: Product | null; categories: Category[]; onSaved(): Promise<void> }) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(item?.category?.id ?? null);
  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '');
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
    const input: ProductInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId: categoryId === null ? undefined : categoryId,
      contentQuantity: parsedContent,
      contentUnit: hasContent === 'yes' ? contentUnit : undefined,
      quantity: parseNumber(quantity),
      minimumStock: parseNumber(minimumStock),
      purchasePrice: parseNumber(purchasePrice),
      salePrice: parseNumber(salePrice),
      active: active === 'yes'
    };
    if (![input.quantity, input.minimumStock].every(Number.isInteger)) return Alert.alert('Estoque em unidades', 'A quantidade e o estoque mínimo devem ser números inteiros.');
    if ([input.quantity, input.minimumStock, input.purchasePrice, input.salePrice].some((value) => !Number.isFinite(value) || value < 0) || (hasContent === 'yes' && (!Number.isFinite(parsedContent) || !parsedContent || parsedContent <= 0))) return Alert.alert('Valores inválidos', 'Revise estoque, conteúdo e preços.');
    mutation.mutate(input);
  };

  const existingPhoto = item?.hasImage && !removePhoto;

  return <>
    <View style={styles.photoArea}>{photo ? <Image source={{ uri: photo.uri }} style={styles.photoPreview} /> : existingPhoto && item ? <ProductImage productId={item.id} hasImage imageVersion={item.imageVersion} style={styles.photoPreview} fallback={<PhotoPlaceholder />} /> : <PhotoPlaceholder />}<View style={styles.photoActions}><SecondaryButton title="Tirar foto" icon="camera-outline" onPress={() => void selectPhoto(true)} compact /><SecondaryButton title="Galeria" icon="images-outline" onPress={() => void selectPhoto(false)} compact />{photo || existingPhoto ? <SecondaryButton title="Remover" icon="trash-outline" danger onPress={() => { setPhoto(null); setRemovePhoto(true); }} compact /> : null}</View></View>
    <Field label="Nome do produto" value={name} onChangeText={setName} placeholder="Ex.: Perfume Floral" />
    <Field label="Descrição" value={description} onChangeText={setDescription} multiline />
    <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
    <SectionTitle>Estoque</SectionTitle>
    <Field label="Quantidade disponível (unidades)" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" placeholder="Ex.: 5" />
    <Text style={styles.helper}>Exemplo: 5 perfumes significam 5 unidades disponíveis.</Text>
    <Field label="Avisar quando restarem (unidades)" value={minimumStock} onChangeText={setMinimumStock} keyboardType="number-pad" />
    <SectionTitle>Conteúdo da embalagem</SectionTitle>
    <SelectField label="Informar peso ou volume?" value={hasContent} options={[{ value: 'no', label: 'Não informar' }, { value: 'yes', label: 'Informar peso ou volume' }]} onChange={setHasContent} />
    {hasContent === 'yes' ? <><Field label="Peso ou volume de uma unidade" value={contentQuantity} onChangeText={setContentQuantity} keyboardType="decimal-pad" placeholder="Ex.: 100" /><SelectField label="Unidade da embalagem" value={contentUnit} options={contentUnits.map((unit) => ({ value: unit, label: unitLabels[unit] }))} onChange={(value) => setContentUnit(value as UnitOfMeasure)} /><Text style={styles.helper}>Exemplo: perfume de 100 ml ou chocolate de 90 g. Isso não altera o estoque.</Text></> : null}
    <Field label="Preço de compra por unidade" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="decimal-pad" />
    <Field label="Preço de venda por unidade" value={salePrice} onChangeText={setSalePrice} keyboardType="decimal-pad" />
    <SelectField label="Situação" value={active} options={[{ value: 'yes', label: 'Ativo' }, { value: 'no', label: 'Inativo' }]} onChange={setActive} />
    {mutation.error ? <ErrorNotice message={errorMessage(mutation.error)} /> : null}<PrimaryButton title={mutation.isPending ? 'Salvando...' : item ? 'Atualizar produto' : 'Cadastrar produto'} onPress={submit} disabled={mutation.isPending} />
  </>;
}

const styles = themedStyles((colors) => ({
  photoArea: { alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surfaceGlass },
  photoPreview: { width: 150, height: 150, borderRadius: 24, backgroundColor: colors.surfaceSoft },
  photoEmpty: { width: 150, height: 130, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  photoActions: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
}));
