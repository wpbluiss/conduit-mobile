import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable, Alert, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const glowP = useSharedValue(0);
  useState(() => { glowP.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true); });
  const glowS = useAnimatedStyle(() => ({ opacity: interpolate(glowP.value, [0, 1], [0.3, 0.7]), transform: [{ scale: interpolate(glowP.value, [0, 1], [1, 1.1]) }] }));

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try { await signIn(email.trim().toLowerCase(), password); }
    catch (err: any) { Alert.alert('Sign In Failed', err.message || 'Check your credentials.'); }
  };

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={[st.ambientGlow, glowS]}>
        <LinearGradient colors={['transparent', 'rgba(14, 165, 233, 0.06)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      </Animated.View>
      <View style={st.content}>
        <Animated.View entering={FadeInDown.delay(100).springify().damping(20)} style={st.logoSection}>
          <View style={st.logoIcon}><Ionicons name="flash" size={32} color={Colors.electric} /></View>
          <Text style={st.logoText}>Conduit AI</Text>
          <Text style={st.tagline}>Your AI-powered command center</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify().damping(18)} style={st.formSection}>
          <Input label="Email" placeholder="you@business.com" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />} />
          <View style={{ height: Spacing.base }} />
          <Input label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} error={errors.password} secureTextEntry={!showPw} autoCapitalize="none"
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            rightIcon={<Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />}
            onRightIconPress={() => setShowPw(!showPw)} />
          <Pressable onPress={() => {}} style={st.forgot}><Text style={st.forgotTxt}>Forgot password?</Text></Pressable>
          <Button title="Sign In" onPress={handleLogin} loading={isLoading} fullWidth size="lg" style={{ marginTop: Spacing.lg }} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).springify().damping(18)} style={st.bottom}>
          <View style={st.divider}><View style={st.divLine} /><Text style={st.divTxt}>or</Text><View style={st.divLine} /></View>
          <Button title="Start Free Trial" onPress={() => {}} variant="secondary" fullWidth size="lg" />
          <Text style={st.trialNote}>14 days free · No commitment · Cancel anytime</Text>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },
  ambientGlow: { position: 'absolute', top: -height * 0.2, left: -width * 0.3, right: -width * 0.3, height: height * 0.6, borderRadius: width },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  logoSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.electricMuted, borderWidth: 1, borderColor: Colors.electricBorder, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  logoText: { ...TextStyles.h1, color: Colors.textPrimary, letterSpacing: -1 },
  tagline: { ...Fonts.body, fontSize: TypeScale.bodySm, color: Colors.textMuted, marginTop: Spacing.xs },
  formSection: { marginBottom: Spacing.xl },
  forgot: { alignSelf: 'flex-end', marginTop: Spacing.md, padding: Spacing.xs },
  forgotTxt: { ...Fonts.bodyMedium, fontSize: TypeScale.bodySm, color: Colors.electric },
  bottom: { gap: Spacing.base },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divTxt: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted },
  trialNote: { ...Fonts.body, fontSize: TypeScale.caption, color: Colors.textMuted, textAlign: 'center' },
});
