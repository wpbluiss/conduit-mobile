import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { Fonts, TypeScale, TextStyles } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/layout';

const { width, height } = Dimensions.get('window');

const BUSINESS_TYPES = [
  'Barbershop / Salon',
  'Contractor / HVAC / Plumber',
  'Medical / Dental',
  'Auto Shop',
  'Other',
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number];

export default function SignUpScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const glowP = useSharedValue(0);
  useState(() => {
    glowP.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  });
  const glowS = useAnimatedStyle(() => ({
    opacity: interpolate(glowP.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(glowP.value, [0, 1], [1, 1.1]) }],
  }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = 'Business name is required';
    if (!ownerName.trim()) e.ownerName = 'Your name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Must be at least 6 characters';
    if (!businessType) e.businessType = 'Please select a business type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhone(text));
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    try {
      await signUp(email.trim().toLowerCase(), password, {
        business_name: businessName.trim(),
        owner_name: ownerName.trim(),
        phone: phone.replace(/\D/g, ''),
        business_type: businessType,
        onboarding_complete: false,
      });
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message || 'Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[st.container, { backgroundColor: colors.bgVoid }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[st.ambientGlow, glowS]}>
        <LinearGradient
          colors={['transparent', 'rgba(14, 165, 233, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify().damping(20)} style={st.header}>
          <Pressable onPress={() => router.back()} style={st.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textSecondary} />
          </Pressable>
          <Image
            source={require('../../assets/images/icon.png')}
            style={st.logoIcon}
          />
          <Text style={st.title}>Start your free trial</Text>
          <Text style={st.subtitle}>14 days free · No credit card required</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify().damping(18)} style={st.form}>
          <Input
            label="Business Name"
            placeholder="Acme Services"
            value={businessName}
            onChangeText={setBusinessName}
            error={errors.businessName}
            autoCapitalize="words"
            icon={<Ionicons name="business-outline" size={18} color={Colors.textMuted} />}
          />

          <View style={{ height: Spacing.base }} />

          <Input
            label="Your Name"
            placeholder="John Smith"
            value={ownerName}
            onChangeText={setOwnerName}
            error={errors.ownerName}
            autoCapitalize="words"
            icon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
          />

          <View style={{ height: Spacing.base }} />

          <Input
            label="Email"
            placeholder="you@business.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
          />

          <View style={{ height: Spacing.base }} />

          <Input
            label="Phone Number"
            placeholder="(555) 123-4567"
            value={phone}
            onChangeText={handlePhoneChange}
            error={errors.phone}
            keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={18} color={Colors.textMuted} />}
          />

          <View style={{ height: Spacing.base }} />

          {/* Business Type Selector */}
          <View style={st.fieldWrap}>
            <Text style={st.label}>What type of business?</Text>
            <Pressable
              onPress={() => setShowTypePicker(!showTypePicker)}
              style={[
                st.selector,
                errors.businessType && st.selectorError,
                showTypePicker && st.selectorActive,
              ]}
            >
              <Ionicons name="storefront-outline" size={18} color={Colors.textMuted} style={st.selectorIcon} />
              <Text style={[st.selectorText, !businessType && st.selectorPlaceholder]}>
                {businessType || 'Select your business type'}
              </Text>
              <Ionicons
                name={showTypePicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </Pressable>
            {showTypePicker && (
              <View style={st.dropdown}>
                {BUSINESS_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      setBusinessType(type);
                      setShowTypePicker(false);
                      setErrors((prev) => ({ ...prev, businessType: '' }));
                    }}
                    style={[st.dropdownItem, businessType === type && st.dropdownItemActive]}
                  >
                    <Text
                      style={[
                        st.dropdownText,
                        businessType === type && st.dropdownTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                    {businessType === type && (
                      <Ionicons name="checkmark" size={18} color={Colors.electric} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
            {errors.businessType ? <Text style={st.errorText}>{errors.businessType}</Text> : null}
          </View>

          <View style={{ height: Spacing.base }} />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            rightIcon={
              <Ionicons
                name={showPw ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textMuted}
              />
            }
            onRightIconPress={() => setShowPw(!showPw)}
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={isLoading}
            fullWidth
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify().damping(18)} style={st.footer}>
          <Text style={st.footerText}>
            Already have an account?{' '}
            <Text style={st.footerLink} onPress={() => router.back()}>
              Sign In
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgVoid },
  ambientGlow: {
    position: 'absolute',
    top: -height * 0.2,
    left: -width * 0.3,
    right: -width * 0.3,
    height: height * 0.6,
    borderRadius: width,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['4xl'] },
  header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.electricMuted,
    borderWidth: 1,
    borderColor: Colors.electricBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: { ...TextStyles.h2, color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  form: { marginBottom: Spacing.xl },
  fieldWrap: { gap: Spacing.sm },
  label: {
    ...Fonts.bodyMedium,
    fontSize: TypeScale.bodySm,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    height: 50,
  },
  selectorError: { borderColor: Colors.danger },
  selectorActive: { borderColor: Colors.electric },
  selectorIcon: { marginRight: Spacing.md },
  selectorText: {
    flex: 1,
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  selectorPlaceholder: { color: Colors.textMuted },
  dropdown: {
    backgroundColor: Colors.bgElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: Colors.electricMuted },
  dropdownText: {
    ...Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textSecondary,
  },
  dropdownTextActive: { color: Colors.electric, ...Fonts.bodyMedium },
  errorText: {
    ...Fonts.body,
    fontSize: TypeScale.caption,
    color: Colors.danger,
    marginLeft: 2,
  },
  footer: { alignItems: 'center', marginTop: Spacing.lg },
  footerText: {
    ...Fonts.body,
    fontSize: TypeScale.bodySm,
    color: Colors.textMuted,
  },
  footerLink: { color: Colors.electric, ...Fonts.bodyMedium },
});
