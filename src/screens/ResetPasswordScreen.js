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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyRound, Lock, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { api } from '../services/api';

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code we emailed you.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({ email, otp: otp.trim(), password, passwordConfirmation: confirmPassword });
      Alert.alert('Password Reset', 'You can now sign in with your new password.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      Alert.alert('Could Not Reset Password', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.forgotPassword(email);
      Alert.alert('Code Sent', 'We\'ve emailed you a new 6-digit code.');
    } catch (e) {
      Alert.alert('Could Not Resend Code', e.message || 'Please try again.');
    } finally {
      setResending(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We emailed a 6-digit code to <Text style={styles.emailText}>{email}</Text>. Enter it below with your new password.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Verification code</Text>
          <View style={styles.inputWrapper}>
            <KeyRound size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="6-digit code"
              placeholderTextColor={COLORS.textMuted}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Minimum 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm new password</Text>
          <View style={styles.inputWrapper}>
            <Lock size={16} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Verify new password"
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Reset Password</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendLink} onPress={handleResend} disabled={resending}>
          <Text style={styles.resendText}>
            {resending ? 'Resending...' : "Didn't get a code? Resend"}
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  emailText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FAF9F6',
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
  resendLink: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
  },
  resendText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
