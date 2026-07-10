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
import { Mail, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { api } from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Missing Email', 'Please enter the email address on your account.');
      return;
    }

    setLoading(true);
    try {
      await api.forgotPassword(trimmedEmail);
      navigation.navigate('ResetPassword', { email: trimmedEmail });
    } catch (e) {
      Alert.alert('Could Not Send Code', e.message || 'Please try again.');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter the email address on your account and we'll send you a 6-digit code to reset your password.
        </Text>

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

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Send Code</Text>
          }
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
});
