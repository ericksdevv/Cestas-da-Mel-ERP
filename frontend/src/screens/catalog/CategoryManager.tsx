import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Pressable, View, Text } from 'react-native';
import { erpApi } from '../../api/erp';
import { Category, CategoryType } from '../../api/types';
import { Field, PrimaryButton, ErrorNotice, Empty, uiStyles } from '../../components/ui';
import { errorMessage } from '../../utils/format';
import { confirmAction } from '../../utils/confirm';
import { colors, themedStyles } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export function CategoryManager({ type, categories, onChanged }: { type: CategoryType; categories: Category[]; onChanged(): Promise<void> }) {
  const [name, setName] = useState('');
  
  const create = useMutation({ 
    mutationFn: () => erpApi.saveCategory({ name: name.trim(), type }), 
    onSuccess: async () => { setName(''); await onChanged(); } 
  });
  
  const remove = useMutation({ 
    mutationFn: (id: number) => erpApi.deleteCategory(id), 
    onSuccess: onChanged 
  });
  
  const submit = () => { if (!name.trim()) return Alert.alert('Nome obrigatório', 'Informe o nome da categoria.'); create.mutate(); };
  const requestRemove = (item: Category) => confirmAction(`Excluir ${item.name}?`, 'A categoria só poderá ser excluída se não estiver sendo usada.', () => remove.mutate(item.id));
  const error = create.error ?? remove.error;
  
  

  return <><Text style={styles.helper}>As categorias ficam salvas no banco e podem ser selecionadas nos novos cadastros.</Text><View style={styles.categoryCreate}><View style={uiStyles.grow}><Field label="Nova categoria" value={name} onChangeText={setName} placeholder={type === 'PRODUCT' ? 'Ex.: Perfumes' : 'Ex.: Embalagens'} onSubmitEditing={submit} /></View><PrimaryButton title="Criar" icon="add" onPress={submit} disabled={create.isPending} compact /></View>{error ? <ErrorNotice message={errorMessage(error)} /> : null}{!categories.length ? <Empty message="Nenhuma categoria criada." /> : <View style={styles.categoryList}>{categories.map(item => <View key={item.id} style={styles.categoryRow}><View style={styles.categoryIcon}><Ionicons name="folder-outline" size={18} color={colors.cyan} /></View><Text style={styles.categoryName}>{item.name}</Text><Pressable onPress={() => requestRemove(item)} accessibilityLabel={`Excluir categoria ${item.name}`} style={({ pressed }) => [styles.iconOnly, pressed && styles.actionPressed]}><Ionicons name="trash-outline" size={18} color={colors.red} /></Pressable></View>)}</View>}</>;
}

const styles = themedStyles((colors) => ({
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
  categoryCreate: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 }, 
  categoryList: { borderTopWidth: 1, borderTopColor: colors.border }, 
  categoryRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }, 
  categoryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyanSoft }, 
  categoryName: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: '500' }, 
  iconOnly: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  actionPressed: { opacity: 0.62, transform: [{ scale: 0.96 }] },
}));
