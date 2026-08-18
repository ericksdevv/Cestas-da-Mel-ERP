import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable,
  SafeAreaView, ScrollView, Text, TextInput, TextInputProps, View,
} from 'react-native';
import { erpApi } from '../api/erp';
import { useAuth } from '../auth/AuthContext';
import { NeonBackground } from '../components/NeonBackground';
import { colors, themedStyles } from '../theme/theme';
import { useAppTheme } from '../theme/ThemeContext';
import { errorMessage } from '../utils/format';

export function LoginScreen() {
  const { isDark, toggle } = useAppTheme();
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('vinicius');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrance = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, speed: 12, bounciness: 4, useNativeDriver: true }).start();
    const floating = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    floating.start();
    return () => floating.stop();
  }, [entrance, float]);

  const submit = async () => {
    if (!username.trim() || !password || (mode === 'register' && !name.trim())) {
      setError('Preencha os campos para continuar.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Use uma senha com pelo menos 6 caracteres.');
      return;
    }
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

  const changeMode = () => {
    setMode((current) => current === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <NeonBackground />
      <Pressable
        onPress={toggle}
        accessibilityLabel={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        style={({ pressed }) => [styles.themeButton, pressed && styles.pressed]}
      ><Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.ink} /></Pressable>

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.access, {
            opacity: entrance,
            transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }]}>
            <View style={styles.identity}>
              <Animated.View style={[styles.logoHalo, {
                transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
              }]}>
                <View style={styles.logo}><MaterialCommunityIcons name="gift-outline" size={31} color={colors.honeyInk} /></View>
              </Animated.View>
              <Text style={styles.brand}>Cestas da Mel</Text>
              <Text style={styles.tagline}>Seu negócio, em ordem.</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeading}>
                <Text style={styles.title}>{mode === 'login' ? 'Bem-vindo' : 'Criar acesso'}</Text>
                <Text style={styles.subtitle}>{mode === 'login' ? 'Entre para continuar' : 'Configure o acesso da loja'}</Text>
              </View>

              {mode === 'register' ? (
                <AccessField icon="person-outline" label="Nome" value={name} onChangeText={setName} editable={!submitting} autoComplete="name" />
              ) : null}
              <AccessField icon="at-outline" label="Usuário" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} editable={!submitting} autoComplete="username" />
              <AccessField
                icon="lock-closed-outline"
                label="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                editable={!submitting}
                onSubmitEditing={() => void submit()}
                returnKeyType="done"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                trailing={(
                  <Pressable onPress={() => setSecure((current) => !current)} hitSlop={10} accessibilityLabel={secure ? 'Mostrar senha' : 'Ocultar senha'}>
                    <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
                  </Pressable>
                )}
              />

              {error ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color={colors.red} /><Text style={styles.errorText}>{error}</Text></View> : null}

              <Pressable disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}>
                {submitting ? <ActivityIndicator color={colors.honeyInk} /> : <><Text style={styles.submitText}>{mode === 'login' ? 'Entrar' : 'Criar e entrar'}</Text><Ionicons name="arrow-forward" size={19} color={colors.honeyInk} /></>}
              </Pressable>

              <Pressable disabled={submitting} onPress={changeMode} style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}>
                <Text style={styles.modeText}>{mode === 'login' ? 'Primeiro acesso' : 'Já tenho acesso'}</Text>
              </Pressable>
            </View>

            <View style={styles.privateAccess}><Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} /><Text style={styles.privateText}>Acesso privado</Text></View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AccessField({ icon, label, trailing, ...props }: TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <Ionicons name={icon} size={19} color={focused ? colors.cyan : colors.muted} />
      <View style={styles.fieldBody}>
        <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
        <TextInput
          placeholderTextColor={colors.muted}
          {...props}
          onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
          style={styles.input}
        />
      </View>
      {trailing}
    </View>
  );
}

const styles = themedStyles((colors, shadows) => ({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 54 },
  access: { width: '100%', maxWidth: 430, alignItems: 'center' },
  themeButton: { position: 'absolute', zIndex: 5, right: 18, top: 18, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, outlineStyle: 'none' } as never,
  identity: { alignItems: 'center', marginBottom: 25 },
  logoHalo: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cyanSoft, marginBottom: 9 },
  logo: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cyan, ...shadows.glow },
  brand: { color: colors.honey, fontSize: 39, lineHeight: 48, textAlign: 'center', fontFamily: Platform.select({ android: 'cursive', ios: 'Snell Roundhand', web: '"Segoe Script", "Brush Script MT", cursive' }) },
  tagline: { color: colors.muted, fontSize: 13, marginTop: 1 },
  card: { width: '100%', padding: 22, gap: 14, borderRadius: 25, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceGlass, ...shadows.card },
  cardHeading: { marginBottom: 3 },
  title: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -.45 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  field: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft },
  fieldFocused: { borderColor: colors.cyan, backgroundColor: colors.cyanSoft },
  fieldBody: { flex: 1, paddingVertical: 8 },
  label: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: .55 },
  labelFocused: { color: colors.cyan },
  input: { flex: 1, minHeight: 26, padding: 0, color: colors.ink, fontSize: 15, outlineStyle: 'none' } as never,
  submit: { minHeight: 52, marginTop: 2, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: colors.cyan, ...shadows.glow, outlineStyle: 'none' } as never,
  submitText: { color: colors.honeyInk, fontSize: 15, fontWeight: '800' },
  modeButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center', outlineStyle: 'none' } as never,
  modeText: { color: colors.cyan, fontSize: 13, fontWeight: '700' },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redSoft },
  errorText: { flex: 1, color: colors.red, fontSize: 13 },
  privateAccess: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 18 },
  privateText: { color: colors.muted, fontSize: 11 },
  pressed: { opacity: .64, transform: [{ scale: .985 }] },
}));
