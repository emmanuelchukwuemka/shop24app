import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, PackageSearch } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import FallbackImage from '../components/FallbackImage';
import LoadingLogo from '../components/LoadingLogo';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  pending: COLORS.textMuted,
  processing: COLORS.accent,
  shipped: '#2563EB',
  delivered: COLORS.success,
  cancelled: COLORS.primary,
};

export default function OrdersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState(route?.params?.status || 'all');

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (e) {
      // Leave whatever was previously loaded on a transient error.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filteredOrders = activeStatus === 'all'
    ? orders
    : orders.filter((o) => o.status === activeStatus);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeStatus === tab.key && styles.activeTab]}
            onPress={() => setActiveStatus(tab.key)}
          >
            <Text style={[styles.tabText, activeStatus === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerFill}>
          <LoadingLogo />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centerFill}>
          <PackageSearch size={64} color={COLORS.textMuted} strokeWidth={1} />
          <Text style={styles.emptyText}>No orders here yet.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={[styles.orderStatus, { color: STATUS_COLORS[order.status] || COLORS.textLight }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>

              {order.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <FallbackImage uri={item.image_url} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                    <Text style={styles.itemMeta}>Qty {item.quantity} · ₦{item.price.toLocaleString()}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.orderCardFooter}>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.orderTotal}>₦{order.total_amount.toLocaleString()}</Text>
              </View>
            </View>
          ))}
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
  tabsScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: SPACING.xs,
    backgroundColor: '#F0F0F2',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: 'bold',
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
    marginTop: SPACING.md,
  },
  listContent: {
    padding: SPACING.md,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderNumber: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  orderStatus: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#F5F5F7',
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  itemName: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.text,
  },
  itemMeta: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  orderDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
  },
  orderTotal: {
    fontSize: FONTS.size.sm + 1,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
});
