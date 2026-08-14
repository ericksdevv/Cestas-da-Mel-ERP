import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, useWindowDimensions, View } from 'react-native';
import { erpApi } from '../api/erp';
import { useAuth } from '../auth/AuthContext';
import { NeonBackground } from '../components/NeonBackground';
import { Field } from '../components/ui';
import { colors, themedStyles } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { errorMessage } from '../utils/format';

export function LoginScreen() {
  const { isDark, toggle } = useAppTheme();
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('vinicius');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, speed: 12, bounciness: 5, useNativeDriver: true }).start();
  }, [entrance]);

  const submit = async () => {
    if (!username.trim() || !password || (mode === 'register' && !name.trim())) return setError('Preencha todos os campos obrigatórios.');
    if (mode === 'register' && password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.');
    setSubmitting(true);
    setError(null);
    try {
      if (mode === 'register') await erpApi.register({ name: name.trim(), username: username.trim(), password });
      await signIn(username, password);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const desktop = width >= 820;
  return (
    <SafeAreaView style={styles.safe}>
      <NeonBackground intense />
      <Pressable onPress={toggle} accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'} style={styles.themeButton}><Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={21} color={colors.ink} /></Pressable>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.page, desktop && styles.pageDesktop, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
          <View style={[styles.hero, desktop && styles.heroDesktop]}>
            <View style={styles.brandRow}>
              <View style={styles.logo}><Ionicons name="gift-outline" size={29} color={colors.honeyInk} /></View>
              <View><Text style={styles.brand}>Cestas da Mel</Text><Text style={styles.brandTag}>GESTÃO DA LOJA</Text></View>
            </View>
            <View>
              <Text style={styles.kicker}>FEITO PARA O SEU NEGÓCIO</Text>
              <Text style={styles.heroTitle}>Organização com{`\n`}o cuidado da Mel.</Text>
              <Text style={styles.heroText}>Estoque, cestas, vendas e caixa reunidos em um só lugar.</Text>
            </View>
            <View style={styles.features}>
              {['Estoque inteligente', 'Fluxo financeiro', 'Produção de cestas'].map((label) => <View key={label} style={styles.feature}><Ionicons name="checkmark-circle" size={17} color={colors.green} /><Text style={styles.featureText}>{label}</Text></View>)}
            </View>
          </View>

          <View style={[styles.form, desktop && styles.formDesktop]}>
            <Text style={styles.title}>{mode === 'login' ? 'Acessar painel' : 'Primeiro acesso'}</Text>
            <Text style={styles.subtitle}>{mode === 'login' ? 'Entre para cuidar da Cestas da Mel.' : 'Crie o primeiro acesso da loja.'}</Text>
            {mode === 'register' ? <Field label="Nome" value={name} onChangeText={setName} editable={!submitting} autoComplete="name" /> : null}
            <Field label="Usuário" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!submitting} autoComplete="username" />
            <View><Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry={secure} editable={!submitting} onSubmitEditing={() => void submit()} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><Pressable onPress={() => setSecure(value => !value)} style={styles.eye} accessibilityLabel={secure ? 'Mostrar senha' : 'Ocultar senha'}><Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={21} color={colors.muted} /></Pressable></View>
            {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={19} color={colors.red} /><Text style={styles.errorText}>{error}</Text></View> : null}
            <Pressable disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}>{submitting ? <ActivityIndicator color={colors.honeyInk} /> : <><Text style={styles.submitText}>{mode === 'login' ? 'ENTRAR NO SISTEMA' : 'CRIAR ACESSO'}</Text><Ionicons name="arrow-forward" size={19} color={colors.honeyInk} /></>}</Pressable>
            <Pressable onPress={() => { setMode(value => value === 'login' ? 'register' : 'login'); setError(null); }}><Text style={styles.switchMode}>{mode === 'login' ? 'Configurar primeiro acesso' : 'Voltar para o login'}</Text></Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themedStyles((colors, shadows) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  themeButton: { position: 'absolute', zIndex: 5, right: 18, top: 18, width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass },
  keyboard: { flex: 1, justifyContent: 'center', padding: 18 },
  page: { width: '100%', maxWidth: 1080, alignSelf: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.surfaceGlass, ...shadows.glow },
  pageDesktop: { minHeight: 610, flexDirection: 'row' },
  hero: { minHeight: 285, padding: 26, justifyContent: 'space-between', gap: 30, backgroundColor: colors.surfaceSoft },
  heroDesktop: { flex: 1.08, padding: 38 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: .55, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  brand: { color: colors.honey, fontSize: 28, fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }) },
  brandTag: { color: colors.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 3 },
  kicker: { color: colors.honey, fontSize: 10, fontWeight: '800', letterSpacing: 2.2, marginBottom: 12 },
  heroTitle: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1 },
  heroText: { color: colors.muted, maxWidth: 430, lineHeight: 21, marginTop: 14 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { color: colors.muted, fontSize: 12 },
  form: { padding: 26, gap: 15, justifyContent: 'center' },
  formDesktop: { flex: .92, padding: 40 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', letterSpacing: -.6 },
  subtitle: { color: colors.muted, lineHeight: 20, marginTop: -7, marginBottom: 4 },
  eye: { position: 'absolute', right: 12, bottom: 13, padding: 3 },
  submit: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cyan, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, ...shadows.glow },
  submitText: { color: colors.honeyInk, fontWeight: '900', fontSize: 13, letterSpacing: .7 },
  pressed: { opacity: .62, transform: [{ scale: .985 }] },
  switchMode: { color: colors.cyan, fontWeight: '700', textAlign: 'center' },
  error: { flexDirection: 'row', gap: 8, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redSoft },
  errorText: { flex: 1, color: colors.red },
}));
