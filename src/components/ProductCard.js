import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShoppingCart } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { useCart } from '../context/CartContext';
import FallbackImage from './FallbackImage';

export default function ProductCard({ product, matchFirstRowHeight }) {
  const navigation = useNavigation();
  const { addToCart, getDiscountedPrice } = useCart();

  const discountedPrice = getDiscountedPrice(product);
  const isTopRated = (product.rating || 4.5) >= 4.8;
  const showBadgeSlot = isTopRated || matchFirstRowHeight;

  const formattedSales =
    product.sales_count >= 1000
      ? `${(product.sales_count / 1000).toFixed(0)}K+`
      : String(product.sales_count || 0);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}>
      {/* Product image */}
      <View style={styles.imageContainer}>
        <FallbackImage uri={product.image_url} style={styles.image} />
      </View>

      {/* Card info */}
      <View style={styles.info}>
        {/* [🌸Sale] badge + title on same row */}
        <View style={styles.titleRow}>
          <View style={styles.saleBadge}>
            <Text style={styles.saleBadgeText}>🌸Sale</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        </View>

        {/* Star seller purple badge (only top-rated). When matchFirstRowHeight is set,
            the slot is still reserved (invisible) so the first card in each masonry
            column lines up at the same height, without affecting any other card. */}
        {showBadgeSlot && (
          <View style={[styles.starSellerBadge, !isTopRated && styles.hiddenBadge]}>
            <Text style={styles.starSellerText}>⭐ Star seller</Text>
          </View>
        )}

        {/* Price + sold count + cart button */}
        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>
              ₦{discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Text>
            <Text style={styles.sold}> 🔥{formattedSales} sold</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={(e) => { e.stopPropagation(); addToCart(product, 1); }}
            activeOpacity={0.7}
          >
            <ShoppingCart size={13} color={COLORS.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
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
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 6,
    backgroundColor: '#FFFFFF',
  },

  /* Title row: badge + name */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  saleBadge: {
    borderWidth: 0.8,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginRight: 4,
    marginTop: 1,
    flexShrink: 0,
  },
  saleBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: 'bold',
    lineHeight: 10,
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
    backgroundColor: '#F5ECFF',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 3,
  },
  starSellerText: {
    color: '#7000FF',
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
});
