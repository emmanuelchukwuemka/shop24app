import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Heart, Share2, Shield, Truck, Award } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';
import FallbackImage from '../components/FallbackImage';
import LoadingLogo from '../components/LoadingLogo';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { addToCart, getDiscountedPrice } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getProductDetails(productId);
        setProduct(data);
        setSelectedVariant(data.variants && data.variants.length > 0 ? data.variants[0] : null);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Failed to load product details.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [productId]);

  if (loading || !product) {
    return (
      <View style={styles.loaderContainer}>
        <LoadingLogo />
      </View>
    );
  }

  const variantLabel = (v) => [v.color, v.size].filter(Boolean).join(' / ') || `Option ${v.id}`;
  const priceSource = { price: selectedVariant?.price ?? product.price, discount_rate: product.discount_rate };
  const discountedPrice = getDiscountedPrice(priceSource);
  const hasDiscount = product.discount_rate > 0;
  const outOfStock = selectedVariant && selectedVariant.stock <= 0;

  // Set up mock images if arrays are empty or string
  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url];

  const cartProduct = () => ({
    ...product,
    price: priceSource.price,
    variant_id: selectedVariant?.id ?? null,
    variant_label: selectedVariant ? variantLabel(selectedVariant) : null,
  });

  const handleAddToCart = () => {
    addToCart(cartProduct(), quantity);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    addToCart(cartProduct(), quantity);
    navigation.navigate('MainTabs', { screen: 'CartTab' });
  };

  const handleShare = async () => {
    // Only the trailing -{id} matters for routing on the website; the text before it
    // is cosmetic, so a simple client-side slug is enough to produce a real working link.
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const url = `https://myshop24.ng/product/${slug}-${product.id}`;
    try {
      await Share.share({ message: `Check out ${product.name} on Shop24: ${url}`, url });
    } catch (e) {
      // User cancelled or the native share sheet failed to open — nothing to recover from here.
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      Alert.alert(
        'Sign in required',
        'Please sign in to save items to your wishlist.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    try {
      await toggleWishlist(product);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update your wishlist.');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert(
        'Sign in required',
        'Please sign in to write a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    if (reviewRating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert('Comment Required', 'Please share a few words about the product.');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.submitReview(product.id, { rating: reviewRating, comment: reviewComment.trim() });
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      Alert.alert('Thank You!', 'Your review has been submitted and is pending moderation.');
    } catch (e) {
      Alert.alert('Could Not Submit Review', e.message || 'Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Navigation Overlay */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Share2 size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { marginLeft: SPACING.sm }]}
            onPress={handleToggleWishlist}
          >
            <Heart
              size={20}
              color={isWishlisted(product.id) ? COLORS.secondary : COLORS.text}
              fill={isWishlisted(product.id) ? COLORS.secondary : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Images Swiper */}
        <View style={styles.swiperContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              if (slide !== activeImageIndex) setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {imagesList.map((img, idx) => (
              <FallbackImage key={idx} uri={img} style={styles.productImage} iconSize={40} />
            ))}
          </ScrollView>
          
          {/* Pagination Indicators */}
          {imagesList.length > 1 && (
            <View style={styles.pagination}>
              {imagesList.map((_, idx) => (
                <View 
                  key={idx} 
                  style={[styles.paginationDot, activeImageIndex === idx && styles.activePaginationDot]} 
                />
              ))}
            </View>
          )}
        </View>

        {/* Temu-style Price and Flash Sale Alert Box */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View>
              <View style={styles.mainPriceBlock}>
                <Text style={styles.detailPrice}>
                  ₦{discountedPrice.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </Text>
                {hasDiscount && (
                  <View style={styles.discountTag}>
                    <Text style={styles.discountTagText}>-{product.discount_rate}% OFF</Text>
                  </View>
                )}
              </View>
              {hasDiscount && (
                <Text style={styles.detailOldPrice}>
                  Reg: ₦{product.price.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </Text>
              )}
            </View>
            
            {/* Flash countdown — only shown for a real, currently-active flash sale */}
            {product.active_flash_sale && (
              <View style={styles.dealsCountdownBox}>
                <Text style={styles.dealsCountdownLabel}>Ends in</Text>
                <CountdownTimer endTime={product.active_flash_sale.end_time} />
              </View>
            )}
          </View>
          
          <View style={styles.flashSoldBadge}>
            <Text style={styles.flashSoldText}>🔥 {product.sales_count}+ sold recently. Highly demanded!</Text>
          </View>
        </View>

        {/* Title and Ratings */}
        <View style={styles.titleSection}>
          <Text style={styles.productTitle}>{product.name}</Text>
          
          <View style={styles.ratingsRow}>
            <View style={styles.starsBox}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={14} 
                  fill={s <= Math.round(product.rating) ? COLORS.accent : 'transparent'} 
                  color={COLORS.accent} 
                />
              ))}
              <Text style={styles.ratingScore}>{product.rating}</Text>
            </View>
            <Text style={styles.reviewLink}>{product.review_count || 0} Reviews</Text>
          </View>
        </View>

        {/* Variant Picker */}
        {product.variants && product.variants.length > 0 && (
          <View style={styles.variantSection}>
            <Text style={styles.variantLabel}>Options</Text>
            <View style={styles.variantChipsRow}>
              {product.variants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const isSoldOut = v.stock <= 0;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.variantChip,
                      isSelected && styles.variantChipSelected,
                      isSoldOut && styles.variantChipDisabled,
                    ]}
                    onPress={() => setSelectedVariant(v)}
                    disabled={isSoldOut}
                  >
                    <Text style={[styles.variantChipText, isSelected && styles.variantChipTextSelected]}>
                      {variantLabel(v)}{isSoldOut ? ' (Sold out)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Trust Badges Panel */}
        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Truck size={16} color={COLORS.primary} />
            <Text style={styles.trustText}>Free Shipping on all orders</Text>
          </View>
          <View style={styles.trustRow}>
            <Shield size={16} color={COLORS.success} />
            <Text style={styles.trustText}>30-Day Return & Secure Checkout</Text>
          </View>
          <View style={styles.trustRow}>
            <Award size={16} color="#FF9900" />
            <Text style={styles.trustText}>Shipped from {product.store_name || 'Shop24 Factory'}</Text>
          </View>
        </View>

        {/* Quantity Selection */}
        <View style={styles.quantitySection}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.qtyControlRow}>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <View style={styles.qtyValBox}>
              <Text style={styles.qtyValText}>{quantity}</Text>
            </View>
            <TouchableOpacity 
              style={styles.qtyBtn} 
              onPress={() => setQuantity(prev => prev + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description Panel */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionHeader}>Product Details</Text>
          <Text
            style={styles.descriptionBody}
            numberOfLines={descriptionExpanded ? undefined : 2}
          >
            {product.description}
          </Text>
          <TouchableOpacity onPress={() => setDescriptionExpanded((v) => !v)}>
            <Text style={styles.readMoreLink}>{descriptionExpanded ? 'Read less' : 'Read more'}</Text>
          </TouchableOpacity>
          <View style={styles.specificationsTable}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Delivery Time</Text>
              <Text style={styles.specValue}>{product.delivery_time || '5-10 business days'}</Text>
            </View>
            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.specLabel}>Merchant</Text>
              <Text style={styles.specValue}>{product.store_name || 'Genuine Seller'}</Text>
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsSectionHeader}>
            <Text style={styles.sectionHeader}>Customer Reviews ({product.reviews?.length || 0})</Text>
            <TouchableOpacity onPress={() => setShowReviewForm((v) => !v)}>
              <Text style={styles.writeReviewLink}>{showReviewForm ? 'Cancel' : 'Write a Review'}</Text>
            </TouchableOpacity>
          </View>

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>Your Rating</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                    <Star
                      size={26}
                      color={COLORS.accent}
                      fill={n <= reviewRating ? COLORS.accent : 'transparent'}
                      style={styles.starPickerIcon}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this product..."
                placeholderTextColor={COLORS.textMuted}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.reviewSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.reviewSubmitText}>Submit Review</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewItemHeader}>
                  <Text style={styles.reviewerName}>{review.user_name}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      color={COLORS.accent}
                      fill={n <= review.rating ? COLORS.accent : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            !showReviewForm && (
              <Text style={styles.noReviewsText}>No reviews yet. Be the first to review this product!</Text>
            )
          )}
        </View>

        {/* Similar Products - continues the feed below the product, like the website */}
        {product.similar_products && product.similar_products.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>You May Also Like</Text>
            <View style={styles.similarGrid}>
              <View style={styles.similarColumn}>
                {product.similar_products.filter((_, idx) => idx % 2 === 0).map((sim) => (
                  <ProductCard key={sim.id} product={sim} />
                ))}
              </View>
              <View style={styles.similarColumn}>
                {product.similar_products.filter((_, idx) => idx % 2 === 1).map((sim) => (
                  <ProductCard key={sim.id} product={sim} />
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
        <TouchableOpacity
          style={[styles.addToCartBtn, outOfStock && styles.disabledBtn]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
          disabled={outOfStock}
        >
          <Text style={styles.addToCartText}>{outOfStock ? 'Sold Out' : 'Add to Cart'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyNowBtn, outOfStock && styles.disabledBtn]}
          onPress={handleBuyNow}
          activeOpacity={0.8}
          disabled={outOfStock}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
  },
  headerRight: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  swiperContainer: {
    width: width,
    height: 360,
    position: 'relative',
    backgroundColor: COLORS.white,
  },
  productImage: {
    width: width,
    height: 360,
  },
  pagination: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  activePaginationDot: {
    width: 14,
    backgroundColor: COLORS.white,
  },
  priceSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainPriceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  detailPrice: {
    fontSize: FONTS.size.xxxl - 2,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginRight: SPACING.xs,
  },
  discountTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountTagText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontWeight: 'bold',
  },
  detailOldPrice: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  dealsCountdownBox: {
    alignItems: 'flex-end',
  },
  dealsCountdownLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  flashSoldBadge: {
    backgroundColor: '#FFF8F6',
    padding: SPACING.xs,
    borderRadius: 4,
    marginTop: SPACING.sm,
  },
  flashSoldText: {
    color: COLORS.primary,
    fontSize: FONTS.size.xs,
    fontWeight: '500',
  },
  titleSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F7',
  },
  productTitle: {
    fontSize: FONTS.size.md + 1,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  ratingScore: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 4,
  },
  reviewLink: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    textDecorationLine: 'underline',
  },
  variantSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F7',
  },
  variantLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  variantChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  variantChip: {
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: '#FAF9F6',
  },
  variantChipSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  variantChipDisabled: {
    opacity: 0.5,
  },
  variantChipText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.text,
    fontWeight: '500',
  },
  variantChipTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  trustSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F7',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  trustText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  quantitySection: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F7',
  },
  quantityLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    backgroundColor: '#F5F5F7',
    width: 32,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    color: COLORS.text,
  },
  qtyValBox: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  qtyValText: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
  },
  descriptionSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
  },
  sectionHeader: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  descriptionBody: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  readMoreLink: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  specificationsTable: {
    borderRadius: 6,
  },
  specRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  specLabel: {
    width: 100,
    color: COLORS.textMuted,
    fontSize: FONTS.size.xs + 1,
  },
  specValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.size.xs + 1,
    fontWeight: '500',
  },
  reviewsSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderBottomWidth: 8,
    borderBottomColor: '#F5F5F7',
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  writeReviewLink: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  reviewForm: {
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  reviewFormLabel: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  starPickerRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  starPickerIcon: {
    marginRight: 4,
  },
  reviewInput: {
    borderRadius: 8,
    height: 90,
    padding: SPACING.sm,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  reviewSubmitBtn: {
    backgroundColor: COLORS.primary,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewSubmitText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
  },
  reviewItem: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
  },
  reviewStars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewComment: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  noReviewsText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  similarSection: {
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
    borderTopWidth: 8,
    borderTopColor: '#F5F5F7',
  },
  similarTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  similarGrid: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    gap: 4,
  },
  similarColumn: {
    flex: 1,
    gap: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#FFE9E0',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  addToCartText: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm + 1,
    fontWeight: 'bold',
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  buyNowText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm + 1,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
