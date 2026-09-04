import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Smartphone, Shirt, Home, Dumbbell, Cpu, HeartPulse, Sparkles,
  Baby, Heart, Wheat, Coffee, Watch, Package,
} from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import LoadingLogo from '../components/LoadingLogo';
import CategoryPanel from '../components/CategoryPanel';

// One icon per top-level category, keyed by slug — same pattern as the
// per-subcategory image lookup in CategoryPanel. Falls back to a generic
// icon for any category slug added on the backend that isn't listed here.
const CATEGORY_ICONS = {
  'consumer-electronics': Smartphone,
  'fashion-clothing': Shirt,
  'home-appliances': Home,
  'sports-outdoors': Dumbbell,
  gadgets: Cpu,
  'health-care': HeartPulse,
  cosmetics: Sparkles,
  'baby-food': Baby,
  'sexual-wellness': Heart,
  'food-grains': Wheat,
  beverages: Coffee,
  'wrist-watches': Watch,
};
const getCategoryIcon = (slug) => CATEGORY_ICONS[slug] || Package;

export default function CategoriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [activeParent, setActiveParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCats = async () => {
      try {
        setLoading(true);
        const data = await api.getCategories();
        setCategories(data);
        if (data.length > 0) {
          setActiveParent(data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    navigation.navigate('HomeTab', { search: searchQuery.trim() });
  };

  // Any subcategory / "view all" tap — from the in-place preview below or from
  // the CategoryOverlay modal — opens the actual product grid as a modal
  // (CategoryProducts, which just reuses HomeScreen filtered by the slug).
  const openProducts = (slug) => navigation.navigate('CategoryProducts', { category: slug });

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <LoadingLogo />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar — jumps to Home filtered by whatever you type */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Find discounts in categories..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.body}>
        {/* Left Pane: Parent Categories list — tapping one opens it as a
            full-screen overlay (CategoryOverlayScreen), and also updates
            the in-place preview on the right for a quick peek without
            leaving this screen. */}
        <ScrollView style={styles.leftPane} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => {
            const isActive = activeParent?.id === cat.id;
            const Icon = getCategoryIcon(cat.slug);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.parentTab, isActive && styles.activeParentTab]}
                onPress={() => {
                  setActiveParent(cat);
                  navigation.navigate('CategoryOverlay', { category: cat });
                }}
                activeOpacity={0.8}
              >
                {isActive && <View style={styles.activeIndicator} />}
                <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                  <Icon size={18} color={isActive ? COLORS.primary : COLORS.textLight} />
                </View>
                <Text style={[styles.parentTabText, isActive && styles.activeParentTabText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Pane: in-place preview of the last-tapped category */}
        <ScrollView style={styles.rightPane} showsVerticalScrollIndicator={false}>
          <CategoryPanel
            category={activeParent}
            onSubcategoryPress={(sub) => openProducts(sub.slug)}
            onViewAllPress={() => activeParent && openProducts(activeParent.slug)}
            style={styles.rightCard}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F2',
    borderRadius: 16,
    height: 34,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONTS.size.xs + 1,
    paddingVertical: 0,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    width: '30%',
    backgroundColor: '#F8F8F9',
  },
  parentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    position: 'relative',
  },
  activeParentTab: {
    backgroundColor: COLORS.primaryLight,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  iconBoxActive: {
    backgroundColor: COLORS.white,
  },
  parentTabText: {
    flex: 1,
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    fontWeight: '500',
    lineHeight: 15,
  },
  activeParentTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  rightPane: {
    width: '70%',
    backgroundColor: COLORS.background,
  },
  rightCard: {
    margin: SPACING.sm,
  },
});
