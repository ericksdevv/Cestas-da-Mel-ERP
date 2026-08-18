import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { colors } from '../theme/theme';

export function NeonBackground({ intense = false }: { intense?: boolean }) {
  const { mode } = useAppTheme();
  
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Fundo Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      
      {/* Sutil brilho no topo, muito elegante e quase imperceptível */}
      <View style={[
        styles.topGlow,
        { backgroundColor: mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(37, 99, 235, 0.04)' }
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  topGlow: {
    position: 'absolute',
    top: -200,
    left: -100,
    right: -100,
    height: 400,
    borderRadius: 200,
    transform: [{ scaleX: 2 }],
  }
});
