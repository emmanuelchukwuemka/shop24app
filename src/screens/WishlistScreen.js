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
import { ArrowLeft, Heart } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import LoadingLogo from '../components/LoadingLogo';

export default function WishlistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { wishlistItems, loadWishlist } = useWishlist();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadWishlist().finally(() => setLoading(false));
    }, [loadWishlist])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <LoadingLogo />
        </View>
      ) : wishlistItems.length === 0 ? (
        <View style={styles.centerFill}>
          <Heart size={64} color={COLORS.textMuted} strokeWidth={1} />
          <Text style={styles.emptyText}>Nothing saved yet. Tap the heart on a product to add it here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <View style={styles.column}>
            {wishlistItems.filter((_, idx) => idx % 2 === 0).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
          <View style={styles.column}>
            {wishlistItems.filter((_, idx) => idx % 2 === 1).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </View>
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
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  column: {
    flex: 1,
    gap: 4,
  },
});
