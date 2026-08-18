import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useAuth } from './auth/AuthContext';
import { CatalogScreen } from './screens/CatalogScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { FinanceScreen } from './screens/FinanceScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MoreScreen } from './screens/MoreScreen';
import { SaleScreen } from './screens/SaleScreen';
import { NeonBackground } from './components/NeonBackground';
import { SplashScreen } from './components/SplashScreen';
import { colors, themedStyles } from './theme/theme';
import { useAppTheme } from './theme/ThemeContext';

type Tab = 'home' | 'catalog' | 'sale' | 'finance' | 'more';
const tabs: { key: Tab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'home', label: 'Início', icon: 'home-variant-outline' },
  { key: 'catalog', label: 'Estoque', icon: 'warehouse' },
  { key: 'sale', label: 'Vender', icon: 'shopping-outline' },
  { key: 'finance', label: 'Caixa', icon: 'chart-donut' },
  { key: 'more', label: 'Mais', icon: 'view-grid-outline' },
];

export function AppRoot() {
  useAppTheme();
  const { token, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashComplete(true), 1650);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !splashComplete) return <SplashScreen />;
  if (!token) return <LoginScreen />;

  return (
    <View style={styles.root}>
      <NeonBackground />
      <View style={styles.content}>
        {tab === 'home' ? <DashboardScreen onNewSale={() => setTab('sale')} /> : null}
        {tab === 'catalog' ? <CatalogScreen /> : null}
        {tab === 'sale' ? <SaleScreen /> : null}
        {tab === 'finance' ? <FinanceScreen /> : null}
        {tab === 'more' ? <MoreScreen /> : null}
      </View>
      <View style={styles.nav}>
        {tabs.map((item) => {
          const active = tab === item.key;
          const sale = item.key === 'sale';
          return <NavItem key={item.key} item={item} active={active} sale={sale} onPress={() => setTab(item.key)} />;
        })}
      </View>
    </View>
  );
}

function NavItem({ item, active, sale, onPress }: { item: typeof tabs[number]; active: boolean; sale: boolean; onPress(): void }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { Animated.spring(progress, { toValue: active ? 1 : 0, speed: 24, bounciness: 7, useNativeDriver: true }).start(); }, [active, progress]);
  return <Pressable onPress={onPress} style={styles.navItem} accessibilityRole="tab" accessibilityState={{ selected: active }}><Animated.View style={[sale ? styles.saleIcon : styles.regularIcon, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [.72, 1] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] }]}><MaterialCommunityIcons name={item.icon} size={sale ? 27 : 22} color={sale ? colors.honeyInk : active ? colors.cyan : colors.muted} /></Animated.View><Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>{active && !sale ? <View style={styles.activeDot} /> : null}</Pressable>;
}

const styles = themedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  content: { flex: 1 },
  nav: { position: 'absolute', left: 10, right: 10, bottom: 8, minHeight: 74, paddingBottom: 8, paddingHorizontal: 5, borderWidth: 1, borderColor: colors.border, borderRadius: 24, backgroundColor: colors.surfaceGlass, flexDirection: 'row', alignItems: 'flex-end', shadowColor: '#000', shadowOpacity: .45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  navItem: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  navLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  navLabelActive: { color: colors.cyan },
  regularIcon: { alignItems: 'center', justifyContent: 'center' },
  saleIcon: { width: 52, height: 52, marginTop: -25, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, elevation: 8, shadowColor: colors.cyan, shadowOpacity: 0.55, shadowRadius: 13, shadowOffset: { width: 0, height: 3 } },
  activeDot: { width: 4, height: 4, borderRadius: 4, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 1, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
}));
