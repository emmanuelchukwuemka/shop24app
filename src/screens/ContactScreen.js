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

export default function ContactScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert('Missing Details', 'Please fill in every field.');
      return;
    }

    setSending(true);
    try {
      await api.submitContact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      Alert.alert('Message Sent', 'Thanks for reaching out — we will get back to you shortly.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could Not Send', e.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
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
        <Text style={styles.headerTitle}>Customer Service</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Have a question or issue with an order? Send us a message and our team will follow up by email.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="What's this about?"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us more..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.sendBtnText}>Send Message</Text>
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
    height: 120,
    paddingTop: SPACING.sm,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
  },
  sendBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
});
