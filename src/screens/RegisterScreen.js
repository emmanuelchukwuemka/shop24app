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
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Store } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(trimmedName, trimmedEmail, password);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      Alert.alert('Registration Failed', e.message || 'Could not create account. Please try again.');
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.brandSection}>
          <Image source={require('../../assets/logo.png')} style={styles.logoBox} resizeMode="contain" />
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join millions of shoppers getting amazing deals every day</Text>

        {/* Name Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <View style={styles.inputWrapper}>
            <User size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

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
              placeholder="Min. 8 characters"
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

        {/* Confirm Password Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
              {showConfirm
                ? <EyeOff size={16} color={COLORS.textMuted} />
                : <Eye size={16} color={COLORS.textMuted} />
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerBtn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.registerBtnText}>Create Account</Text>
          }
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.sellerLink}
          onPress={() => navigation.navigate('BecomeSeller')}
          activeOpacity={0.7}
        >
          <Store size={15} color={COLORS.primary} />
          <Text style={styles.sellerText}>Want to sell on Shop24? Become a Seller</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
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
    marginBottom: SPACING.lg,
  },
  logoBox: {
    width: 64,
    height: 64,
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
  registerBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  loginPrompt: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
  },
  loginLink: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
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
    marginTop: SPACING.lg,
    lineHeight: 16,
  },
});
