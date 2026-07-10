import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const FIELDS = [
  { key: 'name', label: 'Your full name' },
  { key: 'email', label: 'Email address', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'password', label: 'Password', secureTextEntry: true },
  { key: 'store_name', label: 'Store name' },
  { key: 'description', label: 'Store description', multiline: true },
  { key: 'phone', label: 'Phone number', keyboardType: 'phone-pad' },
  { key: 'address', label: 'Store address' },
  { key: 'state', label: 'State' },
  { key: 'logo_url', label: 'Store logo URL', autoCapitalize: 'none' },
  { key: 'bank_name', label: 'Bank name' },
  { key: 'account_number', label: 'Account number', keyboardType: 'number-pad' },
  { key: 'account_name', label: 'Account name' },
];

export default function BecomeSellerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { applySession } = useAuth();
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    for (const field of FIELDS) {
      if (!form[field.key] || !form[field.key].trim()) {
        Alert.alert('Missing Details', `Please fill in "${field.label}".`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await api.registerVendor(form);
      await applySession(result.user, result.token);
      Alert.alert('Welcome to Shop24 Selling!', `Your store "${result.store_name}" is live.`, [
        { text: 'OK', onPress: () => navigation.replace('VendorDashboard') },
      ]);
    } catch (e) {
      Alert.alert('Registration Failed', e.message || 'Could not register as a seller. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become a Seller</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Open your own store on Shop24. Fill in your details below to get started — approval is instant.
        </Text>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={[styles.input, field.multiline && styles.textArea]}
              value={form[field.key] || ''}
              onChangeText={setField(field.key)}
              placeholder={field.label}
              placeholderTextColor={COLORS.textMuted}
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize}
              secureTextEntry={field.secureTextEntry}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 4 : 1}
              textAlignVertical={field.multiline ? 'top' : 'center'}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>Create My Store</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  container: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    height: 44,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    backgroundColor: '#FAF9F6',
  },
  textArea: {
    height: 90,
    paddingTop: SPACING.sm,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
});
