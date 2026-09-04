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
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, ShieldCheck, Truck, Clock } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const CALLBACK_URL = 'shop24://checkout/callback';

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    cartItems,
    cartTotal,
    cartShipping,
    promoCode,
    promoLabel,
    promoDiscount,
    clearCart,
    getCheckoutItems,
  } = useCart();

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: 'Nigeria',
  });
  const [paying, setPaying] = useState(false);

  const finalTotal = Math.max(0, cartTotal + cartShipping - promoDiscount);

  const setField = (field) => (value) => setShipping((prev) => ({ ...prev, [field]: value }));

  const handlePay = async () => {
    const { name, phone, address, city, zip, country } = shipping;
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !zip.trim() || !country.trim()) {
      Alert.alert('Missing Details', 'Please fill in your full shipping address.');
      return;
    }

    setPaying(true);
    try {
      const items = getCheckoutItems();
      const { authorization_url, reference } = await api.initializeCheckout({
        items,
        shipping,
        promoCode,
      });

      const result = await WebBrowser.openAuthSessionAsync(authorization_url, CALLBACK_URL);

      if (result.type !== 'success') {
        // User cancelled or dismissed the Paystack page before finishing payment.
        return;
      }

      const { order } = await api.verifyCheckout({
        reference,
        items,
        shipping,
        promoCode,
      });

      clearCart();
      Alert.alert(
        'Order Confirmed',
        `Thank you! Order ${order.order_number} has been placed and will ship soon.`
      );
      navigation.navigate('MainTabs', { screen: 'HomeTab' });
    } catch (e) {
      Alert.alert('Payment Failed', e.message || 'Something went wrong. Please try again.');
    } finally {
      setPaying(false);
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Shipping Address</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={shipping.name}
            onChangeText={setField('name')}
            placeholder="Recipient's full name"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={shipping.phone}
            onChangeText={setField('phone')}
            placeholder="e.g. 0803 000 0000"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery address</Text>
          <TextInput
            style={styles.input}
            value={shipping.address}
            onChangeText={setField('address')}
            placeholder="Street address"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={shipping.city}
              onChangeText={setField('city')}
              placeholder="City"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Postal code</Text>
            <TextInput
              style={styles.input}
              value={shipping.zip}
              onChangeText={setField('zip')}
              placeholder="ZIP"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={shipping.country}
            onChangeText={setField('country')}
            placeholder="Country"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({cartItems.length})</Text>
            <Text style={styles.summaryVal}>₦{cartTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryVal}>
              {cartShipping === 0 ? 'FREE' : `₦${cartShipping.toLocaleString()}`}
            </Text>
          </View>
          {promoDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon ({promoLabel})</Text>
              <Text style={[styles.summaryVal, { color: COLORS.secondary }]}>
                -₦{promoDiscount.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₦{finalTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.safeBanner}>
          <ShieldCheck size={16} color={COLORS.success} />
          <Text style={styles.safeBannerText}>Payments are processed securely by Paystack</Text>
        </View>

        <View style={styles.deliveryBanner}>
          <Truck size={14} color={COLORS.textLight} />
          <Text style={styles.deliveryBannerText}>Delivered via GIG, 2 Seconds Logistics & Red Star</Text>
        </View>

        <View style={styles.deliveryBanner}>
          <Clock size={14} color={COLORS.textLight} />
          <Text style={styles.deliveryBannerText}>Estimated Delivery: 7-14 days</Text>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={handlePay}
          disabled={paying}
          activeOpacity={0.85}
        >
          {paying
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.payBtnText}>Pay ₦{finalTotal.toLocaleString()}</Text>
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
  sectionTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
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
  divider: {
    height: 8,
    backgroundColor: '#F5F5F7',
    marginHorizontal: -SPACING.xl,
    marginBottom: SPACING.lg,
  },
  summaryBox: {
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
  },
  summaryVal: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.text,
    fontWeight: '500',
  },
  totalRow: {
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONTS.size.sm + 1,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalVal: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  safeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  safeBannerText: {
    fontSize: FONTS.size.xs,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  deliveryBannerText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  payBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.md,
  },
});
