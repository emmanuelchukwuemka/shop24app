import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';
import CategoryPanel from '../components/CategoryPanel';

/**
 * Modal opened by tapping a category in the CategoriesScreen sidebar —
 * shows that category's subcategories full-screen instead of squeezed
 * into the 70%-width in-place pane. Tapping a subcategory (or "view all")
 * opens the CategoryProducts modal on top of this one.
 */
export default function CategoryOverlayScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { category } = route.params;

  const openProducts = (slug) => navigation.navigate('CategoryProducts', { category: slug });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{category.name}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CategoryPanel
          category={category}
          onSubcategoryPress={(sub) => openProducts(sub.slug)}
          onViewAllPress={() => openProducts(category.slug)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.sm,
  },
});
