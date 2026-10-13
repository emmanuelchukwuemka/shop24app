import React, { useState, useEffect, useRef } from 'react';
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
  Share,
  Modal,
  FlatList
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Heart, Share2, Shield, Truck, Award, Search, ShoppingCart, MapPin, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import ProductCard from '../components/ProductCard';
import FallbackImage from '../components/FallbackImage';
import LoadingLogo from '../components/LoadingLogo';
import Toast from '../components/Toast';

const { width } = Dimensions.get('window');

// Single shared fallback so the delivery-partner panel and the Product Details
// table can never show two different guesses when a vendor hasn't set a real
// product.delivery_time — both read from here instead of hardcoding their own.
const DEFAULT_DELIVERY_TIME = '5-10 business days';

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { addToCart, getDiscountedPrice, cartCount } = useCart();
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
  // Color/size/style/material/storage-capacity are independently selectable (like the
  // reference AliExpress-style picker) — the exact combination resolves to one
  // ProductVariant/SKU, with its own price/stock/image, computed below rather than
  // stored directly.
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedStorageCapacity, setSelectedStorageCapacity] = useState(null);
  // Unlimited open-ended dimensions beyond the fixed five — one map entry per
  // vendor-named label (e.g. "Scent", "Voltage") this product's variants actually
  // use, instead of a single fixed slot.
  const [customSelections, setCustomSelections] = useState({});
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [detailsAccordionOpen, setDetailsAccordionOpen] = useState(true);
  const [reviewsAccordionOpen, setReviewsAccordionOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewListRef = useRef(null);
  const swiperRef = useRef(null);

  // Modal content stays mounted between opens, so re-sync scroll position each time
  // it's opened — initialScrollIndex alone only applies on the FlatList's first mount.
  useEffect(() => {
    if (previewVisible) {
      const timer = setTimeout(() => {
        previewListRef.current?.scrollToIndex({ index: previewIndex, animated: false });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [previewVisible]);

  // Picking a different color can bring a different photo to the front of the
  // gallery (see imagesList below) — jump the swiper back to it so it's actually
  // visible instead of requiring the user to manually swipe back to index 0.
  useEffect(() => {
    swiperRef.current?.scrollTo({ x: 0, animated: true });
    setActiveImageIndex(0);
  }, [selectedColor]);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getProductDetails(productId);
        setProduct(data);
        const productVariants = data.variants || [];
        // Prefer the first in-stock combination; fall back to the first variant at
        // all (e.g. everything's sold out) so something is still selected.
        const defaultVariant = productVariants.find((v) => v.stock > 0) || productVariants[0] || null;
        setSelectedColor(defaultVariant?.color ?? null);
        setSelectedSize(defaultVariant?.size ?? null);
        setSelectedStyle(defaultVariant?.style ?? null);
        setSelectedMaterial(defaultVariant?.material ?? null);
        setSelectedStorageCapacity(defaultVariant?.storage_capacity ?? null);
        setCustomSelections({ ...(defaultVariant?.customAttrs || {}) });
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

  const variants = product.variants || [];

  // Fixed dimensions live as plain variant properties; anything else is an
  // unlimited, vendor-named custom dimension (e.g. "Scent", "Voltage") living in
  // each variant's flattened customAttrs map — discovered from the data itself
  // (whatever labels this product's variants actually use), not hardcoded.
  const FIXED_DIMENSION_KEYS = ['color', 'size', 'style', 'material', 'storage_capacity'];
  const getDimValue = (v, key) => (FIXED_DIMENSION_KEYS.includes(key) ? v[key] : (v.customAttrs || {})[key]);
  const customLabels = [...new Set(variants.flatMap((v) => Object.keys(v.customAttrs || {})))];

  // Every independent variant dimension the picker supports — a SKU is the exact
  // combination of whichever of these a product actually uses.
  const DIMENSIONS = [
    { key: 'color', label: 'Color', selected: selectedColor, onSelect: setSelectedColor },
    { key: 'size', label: 'Size', selected: selectedSize, onSelect: setSelectedSize },
    { key: 'style', label: 'Style', selected: selectedStyle, onSelect: setSelectedStyle },
    { key: 'material', label: 'Material', selected: selectedMaterial, onSelect: setSelectedMaterial },
    { key: 'storage_capacity', label: 'Storage/Capacity', selected: selectedStorageCapacity, onSelect: setSelectedStorageCapacity },
    ...customLabels.map((label) => ({
      key: label,
      label,
      selected: customSelections[label] ?? null,
      onSelect: (value) => setCustomSelections((prev) => ({ ...prev, [label]: value })),
    })),
  ];

  // Distinct values per dimension, in first-seen order. A dimension's row only
  // renders at all if at least one variant actually sets it (e.g. most products
  // have no "style" or "material", so those rows just don't show).
  const optionsFor = (key) => [...new Set(variants.map((v) => getDimValue(v, key)).filter(Boolean))];
  const dimensionsWithOptions = DIMENSIONS.map((d) => ({ ...d, options: optionsFor(d.key) }));

  // One representative photo per color (if the vendor set one) — shown as a
  // swatch thumbnail on its chip instead of plain text, mirroring the website.
  const colorImages = {};
  variants.forEach((v) => {
    if (v.color && v.image_url && !colorImages[v.color]) colorImages[v.color] = v.image_url;
  });

  // The one variant matching every currently-selected dimension — dimensions the
  // product doesn't use at all (empty options list) are ignored in the match. This
  // is the SKU lookup: an exact combination match, never a guess or substitution.
  const selectedVariant = variants.find((v) =>
    dimensionsWithOptions.every((d) => d.options.length === 0 || getDimValue(v, d.key) === d.selected)
  ) || null;

  // Is `value` (in dimension `key`) still reachable in-stock given every OTHER
  // dimension's current selection? Drives which chips render as disabled — a
  // combination that was never created by the vendor is never guessed at.
  const isOptionAvailable = (key, value) =>
    variants.some((v) => {
      if (v.stock <= 0) return false;
      return dimensionsWithOptions.every((d) => {
        if (d.key === key) return getDimValue(v, d.key) === value;
        if (d.options.length === 0) return true;
        return getDimValue(v, d.key) === d.selected;
      });
    });

  const variantLabel = selectedVariant
    ? DIMENSIONS.map((d) => getDimValue(selectedVariant, d.key)).filter(Boolean).join(' / ')
    : null;
  const priceSource = { price: selectedVariant?.price ?? product.price, discount_rate: product.discount_rate };
  const discountedPrice = getDiscountedPrice(priceSource);
  const hasDiscount = product.discount_rate > 0;
  const outOfStock = selectedVariant && selectedVariant.stock <= 0;

  // The base image gallery, with the selected color's own photo (if it has one)
  // pinned to the front — so picking a color swaps the main image, without every
  // size/style needing its own duplicate photo.
  const baseImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url];
  const colorImage = optionsFor('color').length > 0
    ? variants.find((v) => v.color === selectedColor && v.image_url)?.image_url
    : null;
  // Always move it to the front, whether or not it's already somewhere in the
  // base gallery — a product whose gallery already includes every variant's
  // photo (very common: vendor just uploads all of them) would otherwise never
  // visibly reorder, since the old check only prepended when it was *missing*.
  const imagesList = colorImage
    ? [colorImage, ...baseImages.filter((img) => img !== colorImage)]
    : baseImages;

  const cartProduct = () => ({
    ...product,
    price: priceSource.price,
    variant_id: selectedVariant?.id ?? null,
    variant_label: variantLabel,
  });

  const handleAddToCart = () => {
    addToCart(cartProduct(), quantity);
    setToastVisible(true);
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
            ref={swiperRef}
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
              <TouchableOpacity
                key={idx}
                activeOpacity={0.95}
                onPress={() => {
                  setPreviewIndex(idx);
                  setPreviewVisible(true);
                }}
              >
                <FallbackImage uri={img} style={styles.productImage} iconSize={40} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          
        </View>

        {/* Thumbnail strip — tap to jump the swiper above to that image */}
        {imagesList.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {imagesList.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.thumbnailWrap, activeImageIndex === idx && styles.thumbnailWrapActive]}
                onPress={() => {
                  setActiveImageIndex(idx);
                  swiperRef.current?.scrollTo({ x: idx * width, animated: true });
                }}
              >
                <FallbackImage uri={img} style={styles.thumbnailImage} iconSize={14} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

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
          <View style={styles.titleRow}>
            <Text style={[styles.productTitle, { flex: 1 }]}>{product.name}</Text>
            <View style={[styles.stockBadge, outOfStock && styles.stockBadgeOut]}>
              <Text style={[styles.stockBadgeText, outOfStock && styles.stockBadgeTextOut]}>
                {outOfStock ? 'Out of Stock' : 'In Stock'}
              </Text>
            </View>
          </View>

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

        {/* Variant Picker — Color, Size, Style, Material, and Storage/Capacity are
            independent rows, each only shown when the product actually uses that
            dimension (most products use only a couple of these). A chip is disabled
            when there's no in-stock combination reachable from it given what's
            already selected in the other rows — never guessed or substituted. */}
        {dimensionsWithOptions.map(({ key, label, options, selected, onSelect }) => {
          // Hide the whole row unless there's more than one value to actually
          // choose between — a single value (e.g. every product's auto-created
          // "Default"/"Standard" placeholder) isn't a real choice.
          if (options.length <= 1) return null;
          return (
            <View key={key} style={styles.variantSection}>
              <Text style={styles.variantLabel}>{label}{selected ? `: ${selected}` : ''}</Text>
              <View style={styles.variantChipsRow}>
                {options.map((value) => {
                  const isSelected = selected === value;
                  const isAvailable = isOptionAvailable(key, value);
                  const swatchImage = key === 'color' ? colorImages[value] : null;
                  if (swatchImage) {
                    return (
                      <TouchableOpacity
                        key={value}
                        style={styles.variantSwatchChip}
                        onPress={() => onSelect(value)}
                        disabled={!isAvailable}
                      >
                        <Image
                          source={{ uri: swatchImage }}
                          style={[
                            styles.variantSwatchThumb,
                            isSelected && styles.variantSwatchThumbSelected,
                            !isAvailable && styles.variantSwatchThumbDisabled,
                          ]}
                          contentFit="cover"
                        />
                        <Text
                          style={[styles.variantSwatchLabel, isSelected && styles.variantChipTextSelected]}
                          numberOfLines={1}
                        >
                          {value}{!isAvailable ? ' (Sold out)' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.variantChip,
                        isSelected && styles.variantChipSelected,
                        !isAvailable && styles.variantChipDisabled,
                      ]}
                      onPress={() => onSelect(value)}
                      disabled={!isAvailable}
                    >
                      <Text style={[styles.variantChipText, isSelected && styles.variantChipTextSelected]}>
                        {value}{!isAvailable ? ' (Sold out)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* SKU of the resolved combination — only once a full valid selection exists */}
        {!!selectedVariant?.sku && (
          <Text style={styles.skuText}>SKU: {selectedVariant.sku}</Text>
        )}

        {/* Trust Badges — three equal columns, icon above text */}
        <View style={styles.trustSection}>
          <View style={styles.trustColumnsRow}>
            <View style={styles.trustColumn}>
              <Truck size={18} color={COLORS.primary} />
              <Text style={styles.trustColumnText}>Free Shipping{'\n'}on all orders</Text>
            </View>
            <View style={styles.trustColumnDivider} />
            <View style={styles.trustColumn}>
              <Shield size={18} color={COLORS.success} />
              <Text style={styles.trustColumnText}>30-Day Return{'\n'}& Secure Checkout</Text>
            </View>
            <View style={styles.trustColumnDivider} />
            <View style={styles.trustColumn}>
              <Award size={18} color="#FF9900" />
              <Text style={styles.trustColumnText}>Shipped from{'\n'}{product.store_name || 'Shop24'}</Text>
            </View>
          </View>

          {/* Delivery partners — a proper panel with the real courier logos,
              not just a text line. */}
          <View style={styles.deliveryPartnersPanel}>
            <View style={styles.deliveryPartnersHeader}>
              <View style={styles.deliveryPartnersHeaderLeft}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.deliveryPartnersTitle}>Delivered via Our Trusted Partners</Text>
              </View>
              <Text style={styles.deliveryPartnersTagline}>Fast. Safe. Reliable.</Text>
            </View>
            <View style={styles.deliveryLogosRow}>
              <Image source={require('../../assets/gig-logo.png')} style={styles.deliveryLogo} contentFit="contain" />
              <View style={styles.deliveryLogoDivider} />
              <Image source={require('../../assets/2seconds-logo.png')} style={styles.deliveryLogo} contentFit="contain" />
              <View style={styles.deliveryLogoDivider} />
              <Image source={require('../../assets/redstar-logo.png')} style={styles.deliveryLogo} contentFit="contain" />
            </View>
            <View style={styles.deliveryEstimateRow}>
              <Clock size={14} color={COLORS.textLight} />
              <Text style={styles.deliveryEstimateText}>
                Estimated Delivery: {product.delivery_time || DEFAULT_DELIVERY_TIME}
              </Text>
            </View>
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

        {/* Product Details — collapsible, like Customer Reviews below */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setDetailsAccordionOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.accordionHeaderLeft}>
            <FileText size={16} color={COLORS.text} />
            <Text style={[styles.sectionHeader, { marginBottom: 0 }]}>Product Details</Text>
          </View>
          {detailsAccordionOpen
            ? <ChevronUp size={18} color={COLORS.textLight} />
            : <ChevronDown size={18} color={COLORS.textLight} />}
        </TouchableOpacity>
        {detailsAccordionOpen && (
          <View style={styles.descriptionSection}>
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
                <Text style={styles.specValue}>{product.delivery_time || DEFAULT_DELIVERY_TIME}</Text>
              </View>
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specLabel}>Merchant</Text>
                <Text style={styles.specValue}>{product.store_name || 'Genuine Seller'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Customer Reviews — collapsible */}
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => setReviewsAccordionOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={styles.accordionHeaderLeft}>
            <Star size={16} color={COLORS.text} />
            <Text style={[styles.sectionHeader, { marginBottom: 0 }]}>Customer Reviews ({product.reviews?.length || 0})</Text>
          </View>
          {reviewsAccordionOpen
            ? <ChevronUp size={18} color={COLORS.textLight} />
            : <ChevronDown size={18} color={COLORS.textLight} />}
        </TouchableOpacity>
        {reviewsAccordionOpen && (
        <View style={styles.reviewsSection}>
          <View style={[styles.reviewsSectionHeader, { justifyContent: 'flex-end' }]}>
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
        )}

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

      {/* Floating cart shortcut — visible as soon as the product page opens,
          mirroring the same bubble already used in the full-screen image
          preview below. Tapping it jumps straight to the cart. */}
      <TouchableOpacity
        style={[styles.previewCartBubble, { bottom: Math.max(insets.bottom, SPACING.md) + 90 }]}
        onPress={() => navigation.navigate('MainTabs', { screen: 'CartTab' })}
        activeOpacity={0.85}
      >
        <ShoppingCart size={18} color={COLORS.white} />
        {cartCount > 0 && (
          <View style={styles.previewCartBadge}>
            <Text style={styles.previewCartBadgeText}>{cartCount}</Text>
          </View>
        )}
        <Text style={styles.previewCartFreeShipText}>Free{'\n'}shipping</Text>
      </TouchableOpacity>

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

      <Toast
        visible={toastVisible}
        message="Added to cart"
        onHide={() => setToastVisible(false)}
      />

      {/* Full-screen image preview — opens on tapping the product image */}
      <Modal visible={previewVisible} animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.previewContainer}>
          <View style={[styles.previewHeader, { paddingTop: insets.top + 6 }]}>
            <TouchableOpacity style={styles.previewHeaderBtn} onPress={() => setPreviewVisible(false)}>
              <ArrowLeft size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.previewCounter}>{previewIndex + 1}/{imagesList.length}</Text>
            <TouchableOpacity style={styles.previewHeaderBtn}>
              <Search size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={previewListRef}
            data={imagesList}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => String(idx)}
            initialScrollIndex={previewIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              if (slide !== previewIndex) setPreviewIndex(slide);
            }}
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                previewListRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 100);
            }}
            renderItem={({ item }) => (
              <View style={styles.previewImageWrap}>
                <FallbackImage uri={item} style={styles.previewImage} resizeMode="contain" iconSize={40} />
              </View>
            )}
          />

          {optionsFor('color').length > 1 && (
            <View style={styles.previewColorPill}>
              <Text style={styles.previewColorPillText}>{optionsFor('color').length} Color</Text>
            </View>
          )}

          <View style={[styles.previewCartBubble, { bottom: insets.bottom + 90 }]}>
            <ShoppingCart size={18} color={COLORS.white} />
            {cartCount > 0 && (
              <View style={styles.previewCartBadge}>
                <Text style={styles.previewCartBadgeText}>{cartCount}</Text>
              </View>
            )}
            <Text style={styles.previewCartFreeShipText}>Free{'\n'}shipping</Text>
          </View>

          <View style={[styles.previewFooter, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
            <TouchableOpacity
              style={[styles.previewAddToCartBtn, outOfStock && styles.disabledBtn]}
              onPress={() => { handleAddToCart(); setPreviewVisible(false); }}
              activeOpacity={0.8}
              disabled={outOfStock}
            >
              <Text style={styles.previewAddToCartText}>{outOfStock ? 'Sold Out' : 'Add to cart'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  thumbnailRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  thumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailWrapActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  stockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stockBadgeOut: {
    backgroundColor: '#F5F5F7',
  },
  stockBadgeText: {
    fontSize: FONTS.size.xs - 1,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  stockBadgeTextOut: {
    color: COLORS.textMuted,
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
  variantSwatchChip: {
    alignItems: 'center',
    width: 68,
    gap: 4,
  },
  variantSwatchThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  variantSwatchThumbSelected: {
    borderColor: COLORS.primary,
  },
  variantSwatchThumbDisabled: {
    opacity: 0.4,
  },
  variantSwatchLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  skuText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
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
  trustColumnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trustColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trustColumnDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  trustColumnText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  deliveryPartnersPanel: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFA',
  },
  deliveryPartnersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  deliveryPartnersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  deliveryPartnersTitle: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: 'bold',
    color: COLORS.text,
    flexShrink: 1,
  },
  deliveryPartnersTagline: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.textLight,
  },
  deliveryLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  deliveryLogo: {
    flex: 1,
    height: 28,
  },
  deliveryLogoDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  deliveryEstimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deliveryEstimateText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
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
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  descriptionSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    paddingTop: 0,
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

  /* Full-screen image preview */
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  previewHeaderBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCounter: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: '600',
  },
  previewImageWrap: {
    width: width,
    flex: 1,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewColorPill: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 150,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewColorPillText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontWeight: '600',
  },
  previewCartBubble: {
    position: 'absolute',
    right: SPACING.md,
    backgroundColor: COLORS.success,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  previewCartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  previewCartFreeShipText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 9,
  },
  previewFooter: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  previewAddToCartBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewAddToCartText: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
  },
});
