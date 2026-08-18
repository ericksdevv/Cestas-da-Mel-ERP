import { Category } from '../../api/types';
import { SelectField } from '../../components/ui';
import { Text } from 'react-native';
import { colors, themedStyles } from '../../theme/theme';

export function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: number | null; onChange(value: number | null): void }) {
  const options = [{ value: 'none', label: 'Sem categoria' }, ...categories.map((item) => ({ value: String(item.id), label: item.name }))];
  return <><SelectField label="Categoria" value={value ? String(value) : 'none'} options={options} onChange={(v) => onChange(v !== 'none' ? Number(v) : null)} /><Text style={styles.helper}>Se não encontrar, você pode adicionar novas na aba Categorias.</Text></>;
}

const styles = themedStyles((colors) => ({
  helper: { color: colors.muted, fontSize: 12, marginTop: -8, lineHeight: 17 },
}));
