import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text, View } from 'react-native';
import { NeonBackground } from './NeonBackground';
import { colors, themedStyles } from '../theme/theme';

export function SplashScreen() {
  const reveal = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(reveal, {
      toValue: 1,
      speed: 11,
      bounciness: 7,
      useNativeDriver: true,
    }).start();

    const pulseLoop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const orbitLoop = Animated.loop(Animated.timing(orbit, {
      toValue: 1,
      duration: 4200,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    pulseLoop.start();
    orbitLoop.start();
    return () => {
      pulseLoop.stop();
      orbitLoop.stop();
    };
  }, [orbit, pulse, reveal]);

  return (
    <View style={styles.root} accessibilityLabel="Carregando Cestas da Mel">
      <NeonBackground />
      <Animated.View style={[styles.content, {
        opacity: reveal,
        transform: [
          { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [.9, 1] }) },
        ],
      }]}> 
        <View style={styles.symbolArea}>
          <Animated.View style={[styles.outerRing, {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.22, .62] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.12] }) }],
          }]} />
          <Animated.View style={[styles.orbit, {
            transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          }]}><View style={styles.orbitDot} /></Animated.View>
          <View style={styles.symbol}>
            <MaterialCommunityIcons name="gift-outline" size={37} color={colors.honeyInk} />
          </View>
        </View>
        <Text style={styles.brand}>Cestas da Mel</Text>
        <View style={styles.loader}><Animated.View style={[styles.loaderFill, { opacity: pulse, transform: [{ scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [.32, 1] }) }] }]} /></View>
      </Animated.View>
    </View>
  );
}

const styles = themedStyles((colors, shadows) => ({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, overflow: 'hidden' },
  content: { alignItems: 'center', gap: 18 },
  symbolArea: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 94, height: 94, borderRadius: 47, borderWidth: 1, borderColor: colors.cyan },
  orbit: { position: 'absolute', width: 108, height: 108, borderRadius: 54, alignItems: 'center' },
  orbitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.honey, shadowColor: colors.honey, shadowOpacity: .9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  symbol: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, ...shadows.glow },
  brand: { color: colors.honey, fontSize: 38, lineHeight: 48, fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }) },
  loader: { width: 64, height: 3, overflow: 'hidden', borderRadius: 3, backgroundColor: colors.surfaceSoft },
  loaderFill: { width: '100%', height: '100%', borderRadius: 3, backgroundColor: colors.cyan },
}));
