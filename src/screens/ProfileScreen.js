import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  CreditCard,
  MapPin,
  MessageSquare,
  Store,
  ChevronRight,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  LogOut,
  User,
} from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const [ordersCount, setOrdersCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      api.getOrders()
        .then((orders) => { if (!cancelled) setOrdersCount(orders.length); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [user])
  );

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch {
              // navigate away regardless
            }
          },
        },
      ]
    );
  };

  const handleBecomeSeller = () => {
    navigation.navigate(user?.is_vendor ? 'VendorDashboard' : 'BecomeSeller');
  };

  if (!user) {
    return (
      <View style={[styles.guestContainer, { paddingTop: insets.top + 40 }]}>
        <View style={styles.guestIconCircle}>
          <User size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.guestTitle}>You're browsing as a guest</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to track orders, save your wishlist, and check out.
        </Text>
        <TouchableOpacity
          style={styles.guestSignInBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.guestSignInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.guestRegisterBtn}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.guestRegisterText}>Create an account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestSellerLink}
          onPress={() => navigation.navigate('BecomeSeller')}
          activeOpacity={0.7}
        >
          <Store size={15} color={COLORS.primary} />
          <Text style={styles.guestSellerText}>Want to sell on Shop24? Become a Seller</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Derive initials from name for avatar placeholder
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}>
        <View style={styles.profileRow}>
          {/* Avatar with initials */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Shop24 User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            {user?.is_vendor && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>Verified Vendor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCol} onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.statVal}>{ordersCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.statCol} onPress={() => navigation.navigate('Wishlist')}>
            <Text style={styles.statVal}>{wishlistCount}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Tracking Grid */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAllText}>View all &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ordersGrid}>
            <TouchableOpacity style={styles.orderGridItem} onPress={() => navigation.navigate('Orders', { status: 'processing' })}>
              <Clock size={20} color={COLORS.textLight} />
              <Text style={styles.orderGridLabel}>Processing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderGridItem} onPress={() => navigation.navigate('Orders', { status: 'shipped' })}>
              <Truck size={20} color={COLORS.textLight} />
              <Text style={styles.orderGridLabel}>Shipped</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderGridItem} onPress={() => navigation.navigate('Orders', { status: 'delivered' })}>
              <CheckCircle2 size={20} color={COLORS.textLight} />
              <Text style={styles.orderGridLabel}>Delivered</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.orderGridItem} onPress={() => navigation.navigate('Orders', { status: 'cancelled' })}>
              <RotateCcw size={20} color={COLORS.textLight} />
              <Text style={styles.orderGridLabel}>Cancelled</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Menu */}
        <View style={[styles.sectionContainer, { marginTop: SPACING.sm }]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Addresses')}>
            <View style={styles.menuLeft}>
              <MapPin size={18} color={COLORS.text} />
              <Text style={styles.menuLabel}>Shipping Addresses</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PaymentMethods')}>
            <View style={styles.menuLeft}>
              <CreditCard size={18} color={COLORS.text} />
              <Text style={styles.menuLabel}>Payment Methods</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Contact')}>
            <View style={styles.menuLeft}>
              <MessageSquare size={18} color={COLORS.text} />
              <Text style={styles.menuLabel}>Customer Service</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleBecomeSeller}>
            <View style={styles.menuLeft}>
              <Store size={18} color={COLORS.primary} />
              <Text style={[styles.menuLabel, { color: COLORS.primary, fontWeight: 'bold' }]}>
                {user?.is_vendor ? 'Vendor Dashboard' : 'Become a Seller (Vendor Portal)'}
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color={COLORS.secondary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  guestIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  guestTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  guestSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  guestSignInBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  guestSignInText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm + 1,
  },
  guestRegisterBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  guestRegisterText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm + 1,
  },
  guestSellerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  guestSellerText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONTS.size.xs + 1,
    marginLeft: 6,
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.medium,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  userName: {
    color: COLORS.white,
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FONTS.size.xs,
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs - 1,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: FONTS.size.md + 1,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONTS.size.xs - 1,
    color: COLORS.textLight,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm + 1,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
  },
  ordersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: SPACING.xs,
  },
  orderGridItem: {
    alignItems: 'center',
    width: 70,
  },
  orderGridLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 6,
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    backgroundColor: '#FFF8F6',
  },
  logoutText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
    marginLeft: SPACING.xs,
  },
});
