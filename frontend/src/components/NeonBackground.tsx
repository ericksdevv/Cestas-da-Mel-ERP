import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, themedStyles } from '../theme/theme';

const particles = [
  { icon: 'bee-flower' as const, left: '8%', top: '16%', size: 20, color: colors.cyan, delay: 0 },
  { icon: 'creation-outline' as const, left: '78%', top: '10%', size: 18, color: colors.magenta, delay: 500 },
  { icon: 'ribbon' as const, left: '86%', top: '45%', size: 23, color: colors.honey, delay: 1000 },
  { icon: 'heart-outline' as const, left: '11%', top: '62%', size: 21, color: colors.violet, delay: 1400 },
  { icon: 'flower-outline' as const, left: '70%', top: '76%', size: 18, color: colors.cyan, delay: 1900 },
] as const;

export function NeonBackground({ intense = false }: { intense?: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.orb, styles.orbCyan, intense && styles.orbIntense]} />
      <View style={[styles.orb, styles.orbViolet, intense && styles.orbIntense]} />
      <Text style={styles.watermark}>Cestas da Mel</Text>
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, index) => <View key={`h-${index}`} style={[styles.gridLineH, { top: `${index * 12.5}%` }]} />)}
        {Array.from({ length: 7 }).map((_, index) => <View key={`v-${index}`} style={[styles.gridLineV, { left: `${index * 16.67}%` }]} />)}
      </View>
      {particles.map((particle, index) => <FloatingParticle key={particle.left} {...particle} index={index} />)}
    </View>
  );
}

function FloatingParticle({ icon, left, top, size, color, delay, index }: typeof particles[number] & { index: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 3000 + index * 380, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 3000 + index * 380, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [delay, index, progress]);

  return (
    <Animated.View style={[styles.particle, { left, top, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.42] }), transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, -14] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '10deg'] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.14] }) },
    ] }]}>
      <MaterialCommunityIcons name={icon} size={size} color={color} />
    </Animated.View>
  );
}

const styles = themedStyles((colors) => ({
  grid: { ...StyleSheet.absoluteFillObject, opacity: 0.22, transform: [{ perspective: 700 }, { rotateX: '58deg' }, { scale: 1.5 }] },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.gridCyan },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.gridViolet },
  orb: { position: 'absolute', width: 260, height: 260, borderRadius: 260, opacity: 0.12 },
  orbCyan: { left: -120, top: -60, backgroundColor: colors.cyan },
  orbViolet: { right: -140, bottom: 40, backgroundColor: colors.violet },
  orbIntense: { opacity: 0.2, transform: [{ scale: 1.3 }] },
  particle: { position: 'absolute' },
  watermark: { position: 'absolute', right: -34, top: '33%', color: colors.watermark, fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }), fontSize: 62, transform: [{ rotate: '-12deg' }] },
}));
