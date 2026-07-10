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
import { ArrowLeft, Store, Package, ShoppingBag, Wallet, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { api } from '../services/api';
import LoadingLogo from '../components/LoadingLogo';

export default function VendorDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      api.getVendorDashboard()
        .then((data) => { if (!cancelled) setDashboard(data); })
        .catch((e) => { if (!cancelled) setError(e.message); })
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
        <Text style={styles.headerTitle}>Vendor Dashboard</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <LoadingLogo />
        </View>
      ) : error || !dashboard ? (
        <View style={styles.centerFill}>
          <Text style={styles.emptyText}>{error || 'Could not load your store.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.storeCard}>
            <View style={styles.storeIconWrap}>
              <Store size={24} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{dashboard.store_name}</Text>
              <View style={styles.approvalRow}>
                <CheckCircle2 size={13} color={dashboard.is_approved ? COLORS.success : COLORS.textMuted} />
                <Text style={[styles.approvalText, { color: dashboard.is_approved ? COLORS.success : COLORS.textMuted }]}>
                  {dashboard.is_approved ? 'Approved seller' : 'Pending approval'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Package size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>{dashboard.products_count}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <ShoppingBag size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>{dashboard.orders_count}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Wallet size={20} color={COLORS.primary} />
              <Text style={styles.statVal}>₦{dashboard.pending_balance.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Total Earnings</Text>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsVal}>₦{dashboard.total_earnings.toLocaleString()}</Text>
            <Text style={styles.earningsSub}>Lifetime, from paid orders</Text>
          </View>

          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {dashboard.recent_orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet.</Text>
          ) : (
            dashboard.recent_orders.map((order) => (
              <View key={order.id} style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.orderStatus}>{order.status}</Text>
                <Text style={styles.orderTotal}>₦{order.total_amount.toLocaleString()}</Text>
              </View>
            ))
          )}

          <Text style={styles.footerNote}>
            Full product, order, and payout management is available on the Shop24 website vendor portal.
          </Text>
        </ScrollView>
      )}
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
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.md,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  storeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  storeName: {
    color: COLORS.white,
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
  },
  approvalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  approvalText: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  statVal: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 6,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  earningsVal: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  earningsSub: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  orderStatus: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    textTransform: 'capitalize',
    marginRight: SPACING.sm,
  },
  orderTotal: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  footerNote: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 16,
  },
});
