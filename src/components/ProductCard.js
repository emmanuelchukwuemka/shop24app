import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShoppingCart, X } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { useCart } from '../context/CartContext';
import FallbackImage from './FallbackImage';

const variantLabel = (v) => [v.color, v.size, v.style].filter(Boolean).join(' / ') || `Option ${v.id}`;

export default function ProductCard({ product, matchFirstRowHeight }) {
  const navigation = useNavigation();
  const { addToCart, getDiscountedPrice } = useCart();
  const [pickerVisible, setPickerVisible] = useState(false);

  const discountedPrice = getDiscountedPrice(product);
  const isTopRated = (product.rating || 4.5) >= 4.8;
  const showBadgeSlot = isTopRated || matchFirstRowHeight;
  const variants = product.variants || [];

  // If variants actually carry different prices, the card shouldn't claim one flat
  // price — show "From ₦<cheapest>" instead, same logic (with discount applied) as
  // what each variant would show individually.
  const variantPrices = variants.map((v) =>
    getDiscountedPrice({ price: v.price ?? product.price, discount_rate: product.discount_rate })
  );
  const hasVariedPricing = new Set(variantPrices).size > 1;
  const cardPrice = hasVariedPricing ? Math.min(...variantPrices) : discountedPrice;

  const formattedSales =
    product.sales_count >= 1000
      ? `${(product.sales_count / 1000).toFixed(0)}K+`
      : String(product.sales_count || 0);

  const addWithVariant = (variant) => ({
    ...product,
    price: variant?.price ?? product.price,
    variant_id: variant?.id ?? null,
    variant_label: variant ? variantLabel(variant) : null,
  });

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (variants.length > 1) {
      setPickerVisible(true);
      return;
    }
    addToCart(addWithVariant(variants[0]), 1);
  };

  const handlePickVariant = (variant) => {
    setPickerVisible(false);
    if (variant.stock <= 0) return;
    addToCart(addWithVariant(variant), 1);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}>
      {/* Product image */}
      <View style={styles.imageContainer}>
        <FallbackImage uri={product.image_url} style={styles.image} />
      </View>

      {/* Card info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.saleTag}>
            <Text style={styles.saleTagText}>SALE</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        </View>

        {/* Star seller purple badge (only top-rated). When matchFirstRowHeight is set,
            the slot is still reserved (invisible) so the first card in each masonry
            column lines up at the same height, without affecting any other card. */}
        {showBadgeSlot && (
          <View style={[styles.starSellerBadge, !isTopRated && styles.hiddenBadge]}>
            <Text style={styles.starSellerText}>STAR SELLER</Text>
          </View>
        )}

        {/* Price + sold count + cart button */}
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>
              {hasVariedPricing ? 'From ' : ''}₦{cardPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.sold}> 🔥{formattedSales} sold</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={handleQuickAdd}
            activeOpacity={0.7}
          >
            <ShoppingCart size={13} color={COLORS.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Shipping info badge — mirrors the website's product card (product.shipping_info) */}
        {!!product.shipping_info && (
          <View style={styles.shippingRow}>
            <Text style={styles.shippingBadgeText}>{product.shipping_info}</Text>
          </View>
        )}
      </View>

      {/* Variant picker — only shown when this product has more than one variant,
          so quick-add from the grid never silently ignores color/size options. */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{product.name}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <X size={18} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={variants}
              keyExtractor={(v) => String(v.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.variantRow, item.stock <= 0 && styles.variantRowDisabled]}
                  onPress={() => handlePickVariant(item)}
                  disabled={item.stock <= 0}
                >
                  <Text style={styles.variantRowText}>{variantLabel(item)}</Text>
                  <Text style={item.stock <= 0 ? styles.variantOutOfStock : styles.variantPrice}>
                    {item.stock <= 0 ? 'Out of stock' : `₦${Number(item.price ?? product.price).toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E2E2E2',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  saleTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 4,
  },
  saleTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FONTS.weight.heavy,
    letterSpacing: 0.5,
  },
  info: {
    padding: 6,
    backgroundColor: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    flex: 1,
    fontSize: 11,
    color: '#222222',
    lineHeight: 15,
  },

  /* Star seller badge */
  starSellerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDF3D9',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 3,
  },
  starSellerText: {
    color: '#8B6D1F',
    fontSize: 8,
    fontWeight: 'bold',
  },
  hiddenBadge: {
    opacity: 0,
  },

  /* Price row */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
  },
  sold: {
    fontSize: 9,
    color: '#666666',
  },
  cartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  /* Shipping info badge */
  shippingRow: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  shippingBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },

  /* Variant picker modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  variantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  variantRowDisabled: {
    opacity: 0.4,
  },
  variantRowText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  variantPrice: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  variantOutOfStock: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
  },
});
