import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  BackHandler
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Camera, Bell, Award, ShieldCheck, Store } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import CountdownTimer from '../components/CountdownTimer';
import LoadingLogo from '../components/LoadingLogo';
import FallbackImage from '../components/FallbackImage';

const { height: windowHeight } = Dimensions.get('window');
const FLASH_ITEM_WIDTH = 160; // flashItem width (152) + marginRight (SPACING.sm)

export default function HomeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { getDiscountedPrice } = useCart();
  
  // State variables
  const [categories, setCategories] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination / endless-shuffle-feed state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [seed, setSeed] = useState(null);
  const loadingMoreRef = useRef(false);
  const cycleRef = useRef(0); // strictly-incrementing counter, keeps every tagged product's React key unique

  // Rotating search suggestion state
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Auto-sliding Flash Sale carousel
  const flashListRef = useRef(null);
  const flashSlideIndexRef = useRef(0);

  // Assigns every item a strictly-incrementing key so repeated product ids — across
  // reshuffles, or an overlapping page from the backend's shuffle/pagination — never collide.
  const tagProducts = (list) => {
    return list.map((p) => {
      cycleRef.current += 1;
      return { ...p, _key: `${cycleRef.current}-${p.id}` };
    });
  };

  // Fetches page 1 of the feed and replaces whatever's currently loaded.
  // Mints a fresh shuffle seed every time (initial load, refresh, search, category switch)
  // — that's what makes pull-to-refresh reshuffle the feed. Search results stay unshuffled.
  const loadFirstPage = async (overrides = {}) => {
    const searchTerm = overrides.search !== undefined ? overrides.search : searchQuery;
    const categorySlug = overrides.category !== undefined ? overrides.category : activeCategory;
    const isSearching = !!searchTerm.trim();
    const newSeed = isSearching ? null : Math.floor(Math.random() * 1000000);

    const result = await api.getProducts({
      search: searchTerm || undefined,
      category: categorySlug !== 'all' ? categorySlug : undefined,
      page: 1,
      seed: newSeed || undefined,
    });

    setProducts(tagProducts(result.products));
    setPage(1);
    setHasMore(result.hasMore);
    setSeed(newSeed);
  };

  // Consume a category/search filter handed off from the Categories tab, or a plain
  // reset request (from re-tapping the Home tab).
  useFocusEffect(
    useCallback(() => {
      const paramCategory = route.params?.category;
      const paramSearch = route.params?.search;
      const paramReset = route.params?.resetHome;
      if (!paramCategory && !paramSearch && !paramReset) return;

      const targetSearch = paramReset ? '' : (paramSearch || '');
      const targetCategory = paramReset ? 'all' : (paramCategory || 'all');

      setSearchQuery(targetSearch);
      setActiveCategory(targetCategory);
      setLoading(true);
      loadFirstPage({ search: targetSearch, category: targetCategory })
        .catch((e) => console.error('[HomeScreen] param filter error:', e))
        .finally(() => setLoading(false));

      navigation.setParams({ category: undefined, search: undefined, resetHome: undefined });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.params?.category, route.params?.search, route.params?.resetHome])
  );

  // Android hardware back button: if a search/category filter is active, clear it and
  // stay on Home instead of letting the OS treat this as "nothing left to do, exit app".
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const isFiltered = !!searchQuery.trim() || activeCategory !== 'all';
        if (!isFiltered) return false; // nothing to clear — let the default behavior happen

        setSearchQuery('');
        setActiveCategory('all');
        setLoading(true);
        loadFirstPage({ search: '', category: 'all' })
          .catch((e) => console.error('[HomeScreen] back-reset error:', e))
          .finally(() => setLoading(false));
        return true; // handled — don't exit the app
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, activeCategory])
  );

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, flashData, keywords] = await Promise.all([
        api.getCategories().catch(() => []),
        api.getFlashSales().catch(() => []),
        api.getTrendingKeywords().catch(() => []),
        loadFirstPage().catch(() => {}),
      ]);

      setCategories(categoriesData);
      setFlashSales(flashData);
      setTrendingKeywords(keywords);
    } catch (e) {
      console.error('[HomeScreen] loadData error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Interval for rotating search placeholder
  useEffect(() => {
    if (trendingKeywords.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % trendingKeywords.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [trendingKeywords]);

  // Auto-slide the Flash Sale carousel every few seconds, looping back to the start
  useEffect(() => {
    if (flashSales.length <= 1) return;
    flashSlideIndexRef.current = 0;
    const interval = setInterval(() => {
      flashSlideIndexRef.current = (flashSlideIndexRef.current + 1) % flashSales.length;
      flashListRef.current?.scrollToIndex({ index: flashSlideIndexRef.current, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [flashSales]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearchSubmit = async () => {
    setLoading(true);
    try {
      await loadFirstPage();
    } catch (e) {
      console.error('[HomeScreen] search error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSearch = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Needed', 'Please allow photo access to search by image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    setSearchQuery('');
    setActiveCategory('all');
    setLoading(true);
    try {
      const matchedProducts = await api.searchByImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setProducts(tagProducts(matchedProducts));
      setPage(1);
      setHasMore(false); // image search returns a fixed set of closest matches, not a real page
      setSeed(null);
    } catch (e) {
      Alert.alert('Image Search Failed', e.message || 'Could not search by image.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = async (catSlug) => {
    setActiveCategory(catSlug);
    setLoading(true);
    try {
      const isSearching = !!searchQuery.trim();
      const newSeed = isSearching ? null : Math.floor(Math.random() * 1000000);

      const result = await api.getProducts({
        category: catSlug !== 'all' ? catSlug : undefined,
        search: searchQuery || undefined,
        page: 1,
        seed: newSeed || undefined,
      });
      setProducts(tagProducts(result.products));
      setPage(1);
      setHasMore(result.hasMore);
      setSeed(newSeed);
    } catch (e) {
      console.error('[HomeScreen] category filter error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll: load the next real page, or — once the catalog is exhausted on the
  // default browse feed — reshuffle and keep the feed going endlessly, Temu-style.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || loading) return;
    const isSearching = !!searchQuery.trim();

    if (!hasMore && isSearching) return; // finite results for an explicit search

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      if (hasMore) {
        const nextPage = page + 1;
        const result = await api.getProducts({
          search: searchQuery || undefined,
          category: activeCategory !== 'all' ? activeCategory : undefined,
          page: nextPage,
          seed: seed || undefined,
        });
        setProducts(prev => [...prev, ...tagProducts(result.products)]);
        setPage(nextPage);
        setHasMore(result.hasMore);
      } else {
        const newSeed = Math.floor(Math.random() * 1000000);
        const result = await api.getProducts({
          category: activeCategory !== 'all' ? activeCategory : undefined,
          page: 1,
          seed: newSeed,
        });
        setProducts(prev => [...prev, ...tagProducts(result.products)]);
        setPage(1);
        setHasMore(result.hasMore);
        setSeed(newSeed);
      }
    } catch (e) {
      console.error('[HomeScreen] loadMore error:', e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, page, seed, searchQuery, activeCategory]);

  const handleScroll = ({ nativeEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom < 400) {
      loadMore();
    }
  };

  // Render Horizontal Flash Sale Item
  const renderFlashSaleItem = ({ item }) => {
    const flashPrice = Number(item.flash_price);
    const originalPrice = Number(item.product.price);
    const discountPercent = originalPrice > 0
      ? Math.round((1 - flashPrice / originalPrice) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.flashItem}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.product.id })}
      >
        <View style={styles.flashItemImageWrap}>
          <FallbackImage uri={item.product.image_url} style={styles.flashItemImage} />
          {discountPercent > 0 && (
            <View style={styles.flashDiscountTag}>
              <Text style={styles.flashDiscountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>
        <Text style={styles.flashItemName} numberOfLines={1}>{item.product.name}</Text>
        <View style={styles.flashPriceRow}>
          <Text style={styles.flashPrice}>₦{flashPrice.toLocaleString()}</Text>
          <Text style={styles.flashOldPrice}>₦{originalPrice.toLocaleString()}</Text>
        </View>
        {item.product.sales_count > 0 && (
          <Text style={styles.flashSoldText}>🔥 {item.product.sales_count} sold</Text>
        )}
      </TouchableOpacity>
    );
  };

  const nextFlashSaleEnd = flashSales.length > 0
    ? flashSales.reduce((soonest, s) => (
        new Date(s.end_time) < new Date(soonest) ? s.end_time : soonest
      ), flashSales[0].end_time)
    : null;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* Header with Search and Cart */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={trendingKeywords[placeholderIndex] ? `Search "${trendingKeywords[placeholderIndex]}"` : "Search Shop24"}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
          />
          <TouchableOpacity style={styles.cameraIcon} onPress={handleImageSearch}>
            <Camera size={15} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBlackBtn} onPress={handleSearchSubmit}>
            <Search size={15} color="#FFFFFF" strokeWidth={3} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Top Categories row */}
      {categories.length > 0 && (
        <View style={styles.topCatBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topCatContent}>
            <Text style={styles.topCatLabel}>TOP CATEGORIES</Text>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} onPress={() => handleCategoryPress(cat.slug)}>
                <Text style={[styles.topCatItem, activeCategory === cat.slug && styles.topCatItemActive]}>
                  {cat.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Shipping / Delivery split bar */}
      <View style={styles.shippingBar}>
        <View style={styles.shippingBarCol}>
          <Text style={styles.shippingBarColText}>FREE SHIPPING FOR YOU</Text>
        </View>
        <View style={styles.shippingBarDivider} />
        <View style={styles.shippingBarCol}>
          <Text style={styles.shippingBarColText}>FAST DELIVERY</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {/* Flash Sales carousel */}
        {flashSales.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.dealsTitleContainer}>
                <Text style={styles.dealsTitle}>⚡ Flash Sale</Text>
              </View>
              {nextFlashSaleEnd && <CountdownTimer endTime={nextFlashSaleEnd} />}
            </View>
            <FlatList
              ref={flashListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={flashSales}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderFlashSaleItem}
              contentContainerStyle={styles.dealsList}
              getItemLayout={(data, index) => ({
                length: FLASH_ITEM_WIDTH,
                offset: FLASH_ITEM_WIDTH * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flashListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 100);
              }}
            />
          </View>
        )}

        {/* Trust / promo banner */}
        <View style={styles.trustBanner}>
          <View style={styles.trustBannerItem}>
            <ShieldCheck size={16} color={COLORS.white} />
            <Text style={styles.trustBannerText}>Buyer Protection</Text>
          </View>
          <View style={styles.trustBannerItem}>
            <Award size={16} color={COLORS.white} />
            <View>
              <Text style={styles.trustBannerText}>Great Value</Text>
              <Text style={styles.trustBannerSubText}>you can trust</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.trustBannerItem} onPress={() => navigation.navigate('BecomeSeller')}>
            <Store size={16} color={COLORS.white} />
            <Text style={styles.trustBannerText}>Become a Vendor</Text>
          </TouchableOpacity>
        </View>

        {/* Product Feed Grid - staggered masonry feed */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingLogo />
          </View>
        ) : products.length > 0 ? (
          <>
            <View style={styles.productGrid}>
              <View style={styles.productColumn}>
                {products.filter((_, idx) => idx % 2 === 0).map((product, colIdx) => (
                  <ProductCard key={product._key} product={product} matchFirstRowHeight={colIdx === 0} />
                ))}
              </View>
              <View style={styles.productColumn}>
                {products.filter((_, idx) => idx % 2 === 1).map((product, colIdx) => (
                  <View key={product._key} style={colIdx === 1 ? styles.secondRowOffset : null}>
                    <ProductCard product={product} matchFirstRowHeight={colIdx === 0} />
                  </View>
                ))}
              </View>
            </View>
            {loadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found. Try searching for something else!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    height: 38,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    paddingVertical: 0,
  },
  cameraIcon: {
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  searchBlackBtn: {
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCatBar: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topCatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  topCatLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.heavy,
    color: COLORS.text,
    marginRight: SPACING.md,
  },
  topCatItem: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    marginRight: SPACING.md,
  },
  topCatItemActive: {
    color: COLORS.primary,
  },
  shippingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
  },
  shippingBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  shippingBarColText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  shippingBarDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  cartButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
    position: 'relative',
  },
  highlightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F6',
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginLeft: 3,
    fontWeight: '500',
  },
  categoryIconsScroll: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  categoryIconBtn: {
    alignItems: 'center',
    width: 76,
    marginHorizontal: 4,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF2EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeIconCircle: {
    backgroundColor: COLORS.primary,
  },
  categoryIconLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 6,
    borderBottomColor: '#F5F5F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  dealsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealsTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.heavy,
    color: COLORS.secondary,
    marginRight: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  dealsList: {
    paddingLeft: SPACING.md,
  },
  flashItem: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 152,
    padding: 8,
    marginRight: SPACING.sm,
    ...SHADOWS.light,
  },
  flashItemImageWrap: {
    position: 'relative',
  },
  flashItemImage: {
    width: '100%',
    height: 136,
    borderRadius: 8,
  },
  flashDiscountTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  flashDiscountText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  flashItemName: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.text,
    marginTop: 8,
  },
  flashPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  flashPrice: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 6,
  },
  flashOldPrice: {
    fontSize: FONTS.size.xs,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  flashSoldText: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.textLight,
    marginTop: 4,
  },
  trustBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
  },
  trustBannerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustBannerText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontWeight: 'bold',
  },
  trustBannerSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
  },
  recommendSection: {
    borderTopWidth: 8,
    borderTopColor: '#F5F5F7',
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
  },
  recommendTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  feedFilters: {
    paddingLeft: SPACING.md,
    marginBottom: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: SPACING.xs,
    backgroundColor: '#F0F0F2',
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  activeFilterTabText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
    gap: 4,
  },
  productColumn: {
    flex: 1,
    gap: 4,
  },
  secondRowOffset: {
    marginTop: 28,
  },
  loadingContainer: {
    minHeight: windowHeight * 0.55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    color: COLORS.textLight,
    textAlign: 'center',
    fontSize: FONTS.size.sm,
  },
});
