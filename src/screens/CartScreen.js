import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, ShoppingBag, ShieldCheck, Ticket } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import FallbackImage from '../components/FallbackImage';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartShipping,
    getDiscountedPrice,
    promoLabel,
    promoDiscount,
    applyPromo,
    clearPromo,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (promoLabel) {
      Alert.alert('Info', 'A coupon is already applied. Remove it first to apply a new one.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Add items to your cart first.');
      return;
    }

    setCouponLoading(true);
    try {
      const promo = await api.validatePromo(code);

      if (promo.min_order_amount > 0 && cartTotal < promo.min_order_amount) {
        Alert.alert('Not Eligible', `Minimum order of ₦${promo.min_order_amount.toLocaleString()} required for this code.`);
        return;
      }

      let discount = 0;
      let label = '';

      if (promo.type === 'percent') {
        discount = cartTotal * (promo.value / 100);
        label = `${promo.code} (${promo.value}% Off)`;
      } else {
        discount = Math.min(cartTotal, promo.value);
        label = `${promo.code} (₦${Number(promo.value).toLocaleString()} Off)`;
      }

      applyPromo(promo.code, discount, label);
      setCouponCode('');
      Alert.alert('Coupon Applied!', `You saved ₦${discount.toLocaleString()}.`);
    } catch (e) {
      Alert.alert('Invalid Code', e.message || 'The coupon code entered is invalid or expired.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }
    if (!user) {
      Alert.alert(
        'Sign in required',
        'Please sign in or create an account to complete your purchase.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  const finalTotal = Math.max(0, cartTotal + cartShipping - promoDiscount);

  if (cartItems.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <ShoppingBag size={80} color={COLORS.textMuted} strokeWidth={1} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>We have factory direct pricing waiting for you!</Text>
        <TouchableOpacity 
          style={styles.emptyBtn} 
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.emptyBtnText}>Go Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart ({cartItems.length})</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Safe Checkout Banner */}
        <View style={styles.safeBanner}>
          <ShieldCheck size={16} color={COLORS.success} />
          <Text style={styles.safeBannerText}>Safe Payments & Buyer Protection on Shop24</Text>
        </View>

        {/* Cart Item Cards list */}
        <View style={styles.listContainer}>
          {cartItems.map((item) => {
            const discPrice = getDiscountedPrice(item);
            return (
              <View key={`${item.id}-${item.variant_id || 'base'}`} style={styles.cartCard}>
                <FallbackImage uri={item.image_url} style={styles.cardImage} />

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                  {item.variant_label ? (
                    <Text style={styles.cardStore}>{item.variant_label}</Text>
                  ) : (
                    <Text style={styles.cardStore}>{item.store_name || 'Genuine Seller'}</Text>
                  )}

                  <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>₦{discPrice.toLocaleString()}</Text>
                    {item.discount_rate > 0 && (
                      <Text style={styles.cardOldPrice}>₦{item.price.toLocaleString()}</Text>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    {/* Quantity adjuster */}
                    <View style={styles.quantityRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity - 1, item.variant_id)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <View style={styles.qtyVal}>
                        <Text style={styles.qtyValText}>{item.quantity}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1, item.variant_id)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Delete button */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => removeFromCart(item.id, item.variant_id)}
                    >
                      <Trash2 size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Promo / Coupon Section */}
        <View style={styles.promoSection}>
          <View style={styles.promoTitleRow}>
            <Ticket size={16} color={COLORS.primary} />
            <Text style={styles.promoSectionTitle}>Apply Promo Code</Text>
          </View>
          
          {promoLabel ? (
            <View style={styles.couponAppliedBadge}>
              <Text style={styles.couponAppliedText}>Applied: {promoLabel}</Text>
              <TouchableOpacity onPress={clearPromo}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter coupon code (e.g. FREE5000)"
                placeholderTextColor={COLORS.textMuted}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.promoApplyBtn}
                onPress={handleApplyCoupon}
                disabled={couponLoading}
              >
                {couponLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.promoApplyText}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Summary Calculations */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryVal}>₦{cartTotal.toLocaleString()}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryVal}>
              {cartShipping === 0 ? 'FREE' : `₦${cartShipping.toLocaleString()}`}
            </Text>
          </View>

          {promoDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coupon Discount</Text>
              <Text style={[styles.summaryVal, { color: COLORS.secondary }]}>
                -₦{promoDiscount.toLocaleString()}
              </Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>₦{finalTotal.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Bar */}
      <View style={[styles.checkoutStickyFooter, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <View style={styles.footerPriceBlock}>
          <Text style={styles.footerPriceLabel}>Total:</Text>
          <Text style={styles.footerPriceVal}>₦{finalTotal.toLocaleString()}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: 24,
    ...SHADOWS.light,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm + 1,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  safeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4FAF6',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
  },
  safeBannerText: {
    fontSize: FONTS.size.xs,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  listContainer: {
    marginVertical: SPACING.sm,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    marginBottom: 2,
    alignItems: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  cardInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  cardName: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    lineHeight: 16,
  },
  cardStore: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  cardPrice: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginRight: 6,
  },
  cardOldPrice: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qtyBtn: {
    backgroundColor: '#F5F5F7',
    width: 26,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  qtyVal: {
    width: 32,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  qtyValText: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  promoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  promoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  promoSectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  promoInputRow: {
    flexDirection: 'row',
  },
  promoInput: {
    flex: 1,
    borderRadius: 6,
    height: 38,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    backgroundColor: '#FAF9F6',
  },
  promoApplyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING.md,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  promoApplyText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
  },
  couponAppliedBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3FAF6',
    borderWidth: 1,
    borderColor: COLORS.couponBorder,
    borderRadius: 6,
    padding: SPACING.sm,
  },
  couponAppliedText: {
    color: COLORS.success,
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
  },
  removeCouponText: {
    color: COLORS.secondary,
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
  },
  summarySection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  summaryTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
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
  checkoutStickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  footerPriceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  footerPriceLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginRight: 4,
  },
  footerPriceVal: {
    fontSize: FONTS.size.lg + 1,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: SPACING.xl * 1.5,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm + 1,
  },
});
