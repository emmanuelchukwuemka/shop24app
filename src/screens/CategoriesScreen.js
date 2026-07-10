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
import { Search } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import { api } from '../services/api';
import FallbackImage from '../components/FallbackImage';
import LoadingLogo from '../components/LoadingLogo';

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

  // Subcategories don't have real photos from the backend yet — use representative stock images
  const getSubcategoryImage = (slug) => {
    switch(slug) {
      case 'audio': return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150';
      case 'smartwatches': return 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=150';
      case 'power': return 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=150';
      case 'cases': return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=150';
      case 'shoes': return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150';
      case 'mens-wear': return 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=150';
      case 'womens-wear': return 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150';
      case 'bags': return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150';
      case 'lighting': return 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150';
      case 'kitchen': return 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=150';
      case 'desk': return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150';
      default: return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150';
    }
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    navigation.navigate('HomeTab', { search: searchQuery.trim() });
  };

  const handleSubcategoryPress = (sub) => {
    navigation.navigate('HomeTab', { category: sub.slug });
  };

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
        {/* Left Pane: Parent Categories list */}
        <ScrollView style={styles.leftPane} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => {
            const isActive = activeParent?.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.parentTab, isActive && styles.activeParentTab]}
                onPress={() => setActiveParent(cat)}
                activeOpacity={0.8}
              >
                {isActive && <View style={styles.activeIndicator} />}
                <Text style={[styles.parentTabText, isActive && styles.activeParentTabText]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Right Pane: Subcategories list grid */}
        <ScrollView style={styles.rightPane} showsVerticalScrollIndicator={false}>
          {activeParent && (
            <View style={styles.rightPaneContent}>
              {/* Promotional header card for the active category */}
              <View style={styles.promoCard}>
                <FallbackImage
                  uri="https://images.unsplash.com/photo-1472851294608-062f824d296e?w=400"
                  style={styles.promoBgImage}
                />
                <View style={styles.promoOverlay}>
                  <Text style={styles.promoTitle}>⚡ {activeParent.name} Deals ⚡</Text>
                  <Text style={styles.promoSub}>Direct pricing. Up to 80% OFF</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Shop by Category</Text>

              {/* Subcategories Grid */}
              <View style={styles.subGrid}>
                {activeParent.children && activeParent.children.length > 0 ? (
                  activeParent.children.map((sub) => (
                    <TouchableOpacity
                      key={sub.id}
                      style={styles.subCard}
                      onPress={() => handleSubcategoryPress(sub)}
                      activeOpacity={0.7}
                    >
                      <FallbackImage
                        uri={getSubcategoryImage(sub.slug)}
                        style={styles.subCardImage}
                      />
                      <Text style={styles.subCardLabel} numberOfLines={2}>
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noSubText}>No subcategories available</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    paddingVertical: 18,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  activeParentTab: {
    backgroundColor: COLORS.white,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  parentTabText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  activeParentTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  rightPane: {
    width: '70%',
    backgroundColor: COLORS.white,
  },
  rightPaneContent: {
    padding: SPACING.md,
  },
  promoCard: {
    height: 90,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.md,
  },
  promoBgImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  promoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingLeft: SPACING.md,
  },
  promoTitle: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  promoSub: {
    color: '#DDDDDD',
    fontSize: FONTS.size.xs,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subCard: {
    width: '30%',
    marginRight: '3%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  subCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F7',
    marginBottom: 6,
  },
  subCardLabel: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 12,
  },
  noSubText: {
    color: COLORS.textMuted,
    fontSize: FONTS.size.sm,
    paddingTop: SPACING.lg,
    width: '100%',
    textAlign: 'center',
  },
});
