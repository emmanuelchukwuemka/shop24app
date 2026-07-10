import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Store } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      Alert.alert('Login Failed', e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
        )}

        {/* Logo / Brand */}
        <View style={styles.brandSection}>
          <Image source={require('../../assets/logo.png')} style={styles.logoBox} resizeMode="contain" />
          <Text style={styles.tagline}>Nigeria's #1 Discount Store</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue shopping</Text>

        {/* Email Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputWrapper}>
            <Mail size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
              {showPassword
                ? <EyeOff size={16} color={COLORS.textMuted} />
                : <Eye size={16} color={COLORS.textMuted} />
              }
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.forgotPasswordLink}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.loginBtnText}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New to Shop24?</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Link */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.registerBtnText}>Create an account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sellerLink}
          onPress={() => navigation.navigate('BecomeSeller')}
          activeOpacity={0.7}
        >
          <Store size={15} color={COLORS.primary} />
          <Text style={styles.sellerText}>Want to sell on Shop24? Become a Seller</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 1.5,
  },
  logoBox: {
    width: 72,
    height: 72,
    marginBottom: SPACING.xs,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: FONTS.size.xs,
    fontWeight: '500',
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: SPACING.sm,
    height: 48,
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: 4,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
  },
  forgotPasswordText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: FONTS.size.xs,
    marginHorizontal: SPACING.sm,
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: COLORS.primary,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  sellerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  sellerText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONTS.size.xs + 1,
    marginLeft: 6,
  },
  terms: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 16,
  },
});
