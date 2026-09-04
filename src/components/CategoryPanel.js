import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ChevronRight, LayoutGrid } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import FallbackImage from './FallbackImage';

// Short tagline shown under the category heading.
const CATEGORY_TAGLINES = {
  'consumer-electronics': 'Premium tech for every lifestyle',
  'fashion-clothing': 'Styles for every occasion',
  'home-appliances': 'Upgrade your everyday living',
  'sports-outdoors': 'Gear up and get moving',
  gadgets: 'Smart tools for smart living',
  'health-care': 'Wellness essentials you can trust',
  cosmetics: 'Beauty picks, curated for you',
  'baby-food': 'Trusted nutrition for little ones',
  'sexual-wellness': 'Comfort and care, discreetly delivered',
  'food-grains': 'Pantry staples, always fresh',
  beverages: 'Drinks for every moment',
  'wrist-watches': 'Timepieces that make a statement',
};
const getCategoryTagline = (slug) => CATEGORY_TAGLINES[slug] || 'Explore our top picks';

// Subcategories don't have real photos from the backend yet (image_icon is unset on
// every category) — use representative stock images, one per actual subcategory slug.
const getSubcategoryImage = (slug) => {
  switch (slug) {
    case 'smartphones-accessories': return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300';
    case 'computer-office': return 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300';
    case 'smart-electronics': return 'https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=300';
    case 'womens-fashion': return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300';
    case 'mens-fashion': return 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=300';
    case 'luxury-watches': return 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300';
    case 'smart-appliances': return 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300';
    case 'decor-lighting': return 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300';
    case 'kitchen-dining': return 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=300';
    case 'cycling-bikes': return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=300';
    case 'camping-hiking': return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=300';
    case 'fitness-gym': return 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300';
    default: return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
  }
};

// Cycled per subcategory card — pastel background + matching accent for the arrow badge.
const ACCENT_PALETTE = [
  { bg: '#FCE7E7', accent: COLORS.primary },
  { bg: '#E3F2FD', accent: '#2563EB' },
  { bg: '#E8F5E9', accent: '#16A34A' },
  { bg: '#F3E8FF', accent: '#9333EA' },
  { bg: '#FFF3E0', accent: '#EA580C' },
  { bg: '#E0F7FA', accent: '#0891B2' },
];

/**
 * Heading + tagline + subcategory grid + "view all" banner for one parent
 * category. Shared between CategoriesScreen's in-place preview and
 * CategoryOverlayScreen's modal — same look, same behavior, either place.
 */
export default function CategoryPanel({ category, onSubcategoryPress, onViewAllPress, style }) {
  if (!category) return null;

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.heading}>{category.name}</Text>
      <Text style={styles.tagline}>{getCategoryTagline(category.slug)}</Text>

      <View style={styles.subGrid}>
        {category.children && category.children.length > 0 ? (
          category.children.map((sub, i) => {
            const palette = ACCENT_PALETTE[i % ACCENT_PALETTE.length];
            return (
              <TouchableOpacity
                key={sub.id}
                style={styles.subCard}
                onPress={() => onSubcategoryPress(sub)}
                activeOpacity={0.7}
              >
                <View style={[styles.subCardImageWrap, { backgroundColor: palette.bg }]}>
                  <FallbackImage uri={getSubcategoryImage(sub.slug)} style={styles.subCardImage} />
                  <View style={[styles.arrowBadge, { backgroundColor: palette.accent }]}>
                    <ArrowUpRight size={12} color={COLORS.white} strokeWidth={2.5} />
                  </View>
                </View>
                <Text style={styles.subCardLabel} numberOfLines={2}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noSubText}>No subcategories available</Text>
        )}
      </View>

      <TouchableOpacity style={styles.viewAllBanner} onPress={onViewAllPress} activeOpacity={0.8}>
        <View style={styles.viewAllIconBox}>
          <LayoutGrid size={20} color={COLORS.primary} />
        </View>
        <View style={styles.viewAllTextGroup}>
          <Text style={styles.viewAllTitle}>View all {category.name}</Text>
          <Text style={styles.viewAllSubtitle}>See every product in this category</Text>
        </View>
        <ChevronRight size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    ...SHADOWS.light,
  },
  heading: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tagline: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  subCard: {
    width: '31%',
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  subCardImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    overflow: 'visible',
  },
  subCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  arrowBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  subCardLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  noSubText: {
    color: COLORS.textMuted,
    fontSize: FONTS.size.sm,
    paddingTop: SPACING.lg,
    width: '100%',
    textAlign: 'center',
  },
  viewAllBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  viewAllIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  viewAllTextGroup: {
    flex: 1,
  },
  viewAllTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllSubtitle: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
