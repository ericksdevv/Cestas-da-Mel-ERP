import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode, useEffect, useRef } from 'react';
import {
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView,
  ScrollView, StyleProp, Text, TextInput, TextInputProps, useWindowDimensions, View, ViewStyle,
} from 'react-native';
import { colors, shadows, themedStyles } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';

export function Screen({ children, refreshing }: PropsWithChildren<{ refreshing?: boolean }>) {
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [entrance]);
  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animatedScreen, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
          {children}
          {refreshing ? <ActivityIndicator color={colors.cyan} style={styles.refreshing} /> : null}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function TapScale({ children, onPress, disabled, style }: PropsWithChildren<{ onPress(): void; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed, disabled && styles.disabled]}>{children}</Pressable>;
}

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  const { isDark, toggle } = useAppTheme();
  return <View style={styles.header}><View style={styles.headerText}><Text style={styles.brandSignature}>Cestas da Mel</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><View style={styles.headerActions}>{action}<Pressable onPress={toggle} accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'} style={styles.themeButton}><Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.ink} /></Pressable></View></View>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return <View style={styles.sectionTitle}><Text style={styles.sectionTitleText}>{children}</Text>{action}</View>;
}

export function PrimaryButton({ title, icon, onPress, disabled, compact }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress(): void; disabled?: boolean; compact?: boolean }) {
  return <TapScale disabled={disabled} onPress={onPress} style={[styles.primaryButton, compact && styles.compactButton]}>{icon ? <Ionicons name={icon} size={18} color={colors.honeyInk} /> : null}<Text style={styles.primaryButtonText}>{title}</Text></TapScale>;
}

export function SecondaryButton({ title, icon, onPress, danger, compact }: { title: string; icon?: keyof typeof Ionicons.glyphMap; onPress(): void; danger?: boolean; compact?: boolean }) {
  return <TapScale onPress={onPress} style={[styles.secondaryButton, compact && styles.compactButton]}>{icon ? <Ionicons name={icon} size={18} color={danger ? colors.red : colors.ink} /> : null}<Text style={[styles.secondaryButtonText, danger && { color: colors.red }]}>{title}</Text></TapScale>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && styles.multiline, props.style]} /></View>;
}

export function Chips<T extends string>({ values, value, labels, onChange }: { values: readonly T[]; value: T; labels?: Partial<Record<T, string>>; onChange(value: any): void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{values.map((item) => <TapScale key={item} onPress={() => onChange(item)} style={[styles.chip, value === item && styles.chipActive]}><Text style={[styles.chipText, value === item && styles.chipTextActive]}>{labels?.[item] ?? item}</Text></TapScale>)}</ScrollView>;
}

export function Tabs<T extends string>({ values, value, labels, onChange }: { values: readonly T[]; value: T; labels?: Partial<Record<T, string>>; onChange(value: T): void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>{values.map((item) => { const active = item === value; return <Pressable key={item} onPress={() => onChange(item)} style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.tabPressed]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{labels?.[item] ?? item}</Text></Pressable>; })}</ScrollView>;
}

export function Metric({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'danger' | 'positive' }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, tone === 'danger' && { color: colors.red }, tone === 'positive' && { color: colors.green }]}>{value}</Text></View>;
}

export function ListRow({ icon, title, subtitle, value, tone, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; value?: string; tone?: 'positive' | 'danger'; onPress?: () => void }) {
  const body = <><View style={styles.rowIcon}><Ionicons name={icon} size={19} color={colors.ink} /></View><View style={styles.rowBody}><Text style={styles.rowTitle}>{title}</Text>{subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}</View>{value ? <Text style={[styles.rowValue, tone === 'positive' && { color: colors.green }, tone === 'danger' && { color: colors.red }]}>{value}</Text> : null}{onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}</>;
  return onPress ? <TapScale onPress={onPress} style={styles.row}>{body}</TapScale> : <View style={styles.row}>{body}</View>;
}

export function Loading() { const pulse=useRef(new Animated.Value(.55)).current; useEffect(()=>{const loop=Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:650,useNativeDriver:true}),Animated.timing(pulse,{toValue:.55,duration:650,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[pulse]); return <Animated.View style={[styles.center,{opacity:pulse}]}><ActivityIndicator size="large" color={colors.cyan} /><Text style={styles.subtitle}>Atualizando...</Text></Animated.View>; }
export function Empty({ message }: { message: string }) { return <View style={styles.empty}><Ionicons name="file-tray-outline" size={30} color={colors.muted} /><Text style={styles.subtitle}>{message}</Text></View>; }
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) { return <View style={styles.error}><Ionicons name="alert-circle-outline" size={22} color={colors.red} /><Text style={styles.errorText}>{message}</Text>{onRetry ? <SecondaryButton title="Tentar novamente" onPress={onRetry} compact /> : null}</View>; }

export function Sheet({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose(): void }>) {
  const { width, height } = useWindowDimensions();
  const sheetWidth = Math.min(width, 760);
  const sheetHeight = Math.max(280, height - (Platform.OS === 'web' ? 20 : 8));
  return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} style={[styles.modalBackdrop, { width }]}><View style={[styles.sheet, { width: sheetWidth, maxHeight: sheetHeight }]}><View style={styles.sheetHead}><View style={styles.sheetHeadText}><Text style={styles.sheetBrand}>Cestas da Mel</Text><Text style={styles.sheetTitle}>{title}</Text></View><Pressable onPress={onClose} accessibilityLabel="Fechar" hitSlop={12} style={styles.closeButton}><Ionicons name="close" size={23} color={colors.ink} /></Pressable></View><ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag" nestedScrollEnabled contentContainerStyle={styles.sheetBody}>{children}</ScrollView></View></KeyboardAvoidingView></Modal>;
}

export const uiStyles = themedStyles((colors, shadows) => ({
  panel: { backgroundColor: colors.surfaceGlass, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, ...shadows.card },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flex: 1 },
  muted: { color: colors.muted, fontSize: 13 },
}));

const styles = themedStyles((colors, shadows) => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  animatedScreen: { flex: 1 },
  screen: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 18, paddingBottom: 116, gap: 14 },
  refreshing: { marginTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass },
  brandSignature: { color: colors.honey, fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }), fontSize: 19, marginBottom: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -.5 },
  subtitle: { color: colors.muted, marginTop: 4 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitleText: { color: colors.ink, fontSize: 18, fontWeight: '700', letterSpacing: .2 },
  primaryButton: { minHeight: 48, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cyan, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...shadows.glow },
  compactButton: { minHeight: 38, paddingHorizontal: 12 },
  primaryButtonText: { color: colors.honeyInk, fontWeight: '700' },
  secondaryButton: { minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryButtonText: { color: colors.ink, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  field: { gap: 7 },
  label: { color: colors.ink, fontWeight: '600' },
  input: { minHeight: 49, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, color: colors.ink, borderRadius: 13, paddingHorizontal: 13 },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass },
  chipActive: { backgroundColor: colors.cyanSoft, borderColor: colors.cyan },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: colors.cyan },
  tabsScroll: { width: '100%', flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabs: { minWidth: '100%', gap: 22, paddingHorizontal: 2 },
  tab: { minHeight: 43, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.cyan },
  tabPressed: { opacity: 0.58 },
  tabText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: colors.cyan, fontWeight: '800' },
  metric: { flex: 1, minWidth: 140, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, ...shadows.card },
  metricLabel: { color: colors.muted },
  metricValue: { color: colors.ink, fontWeight: '700', fontSize: 21, marginTop: 7 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { opacity: 0.55 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cyanSoft, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1 },
  rowTitle: { color: colors.ink, fontWeight: '600' },
  rowSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  rowValue: { color: colors.ink, fontWeight: '700', maxWidth: 100 },
  center: { padding: 38, alignItems: 'center', gap: 10 },
  empty: { padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surfaceGlass },
  error: { padding: 14, gap: 10, alignItems: 'center', borderRadius: 14, backgroundColor: colors.redSoft },
  errorText: { color: colors.red, textAlign: 'center' },
  modalBackdrop: { flex: 1, width: '100%', alignSelf: 'stretch', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: colors.backdrop, paddingTop: 28 },
  sheet: { width: '100%', maxWidth: 760, maxHeight: '94%', minHeight: 250, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, overflow: 'hidden', ...shadows.glow },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetHeadText: { flex: 1, paddingRight: 12 },
  sheetBrand: { color: colors.honey, fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }), fontSize: 16 },
  sheetTitle: { color: colors.ink, fontWeight: '700', fontSize: 20 },
  closeButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  sheetScroll: { width: '100%', flexShrink: 1 },
  sheetBody: { padding: 18, paddingBottom: 56, gap: 14, flexGrow: 1 },
}));
