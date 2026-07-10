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
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import LoadingLogo from '../components/LoadingLogo';

export default function AddressesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api.getOrders()
        .then((orders) => {
          if (cancelled) return;
          // Addresses aren't a separate saved entity — derive the unique ones actually used on past orders.
          const seen = new Set();
          const unique = [];
          for (const order of orders) {
            const key = [order.shipping_name, order.shipping_phone, order.shipping_address, order.shipping_city, order.shipping_zip, order.shipping_country].join('|');
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(order);
            }
          }
          setAddresses(unique);
        })
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
        <Text style={styles.headerTitle}>Shipping Addresses</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <LoadingLogo />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.centerFill}>
          <MapPin size={64} color={COLORS.textMuted} strokeWidth={1} />
          <Text style={styles.emptyText}>
            You don't have any saved addresses yet. The address you enter at checkout will show up here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {addresses.map((order) => (
            <View key={order.id} style={styles.addressCard}>
              <View style={styles.addressIconWrap}>
                <MapPin size={18} color={COLORS.primary} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{order.shipping_name}</Text>
                <Text style={styles.addressPhone}>{order.shipping_phone}</Text>
                <Text style={styles.addressLine}>
                  {order.shipping_address}, {order.shipping_city}, {order.shipping_zip}, {order.shipping_country}
                </Text>
                <Text style={styles.usedOn}>Used on order {order.order_number}</Text>
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
    backgroundColor: '#F5F5F7',
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
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: SPACING.md,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addressPhone: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginTop: 2,
  },
  addressLine: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginTop: 4,
    lineHeight: 18,
  },
  usedOn: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});
