import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ShieldCheck, CreditCard } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import LoadingLogo from '../components/LoadingLogo';

export default function PaymentMethodsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api.getOrders()
        .then((data) => { if (!cancelled) setOrders(data); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <ShieldCheck size={22} color={COLORS.success} />
          <Text style={styles.infoText}>
            Shop24 doesn't store your card details. Every purchase is processed securely through
            Paystack's checkout at payment time.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Payment History</Text>

        {loading ? (
          <View style={{ marginTop: SPACING.xl }}>
            <LoadingLogo size={48} />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <CreditCard size={64} color={COLORS.textMuted} strokeWidth={1} />
            <Text style={styles.emptyText}>No payments yet.</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.paymentRow}>
              <View style={styles.paymentIconWrap}>
                <CreditCard size={18} color={COLORS.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethod}>
                  {order.payment_method === 'paystack_mobile' ? 'Paystack' : order.payment_method}
                </Text>
                <Text style={styles.paymentDate}>
                  Order {order.order_number} · {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>₦{order.total_amount.toLocaleString()}</Text>
                <Text style={[
                  styles.paymentStatus,
                  { color: order.payment_status === 'paid' ? COLORS.success : COLORS.textMuted },
                ]}>
                  {order.payment_status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  content: {
    padding: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3FAF6',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
    marginTop: SPACING.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  paymentDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  paymentStatus: {
    fontSize: FONTS.size.xs,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
