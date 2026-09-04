import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, User, ShoppingCart } from 'lucide-react-native';
import { COLORS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import SpinWheelScreen from '../screens/SpinWheelScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import AddressesScreen from '../screens/AddressesScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import ContactScreen from '../screens/ContactScreen';
import VendorDashboardScreen from '../screens/VendorDashboardScreen';
import BecomeSellerScreen from '../screens/BecomeSellerScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CategoryOverlayScreen from '../screens/CategoryOverlayScreen';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.black,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{ position: 'relative' }}>
              <Image
                source={require('../../assets/logo.png')}
                style={tabStyles.homeIcon}
                resizeMode="contain"
              />
              {focused && <View style={tabStyles.activeDot} />}
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            // Always jump back to the default, unfiltered feed — not just whatever Home was showing.
            navigation.navigate('HomeTab', { resetHome: Date.now() });
          },
        })}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesScreen}
        options={{
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color }) => <Search size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <ShoppingCart size={22} color={color} />
              {cartCount > 0 && (
                <View style={tabStyles.cartBadge}>
                  <Text style={tabStyles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'You',
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ProductDetails" component={ProductDetailScreen} />
      <Stack.Screen name="SpinWheel" component={SpinWheelScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
      <Stack.Screen name="BecomeSeller" component={BecomeSellerScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="CategoryOverlay" component={CategoryOverlayScreen} options={{ presentation: 'modal' }} />
      {/* Reuses HomeScreen itself — it already filters by route.params.category
          and clears the param on focus, so this is a fully working product
          grid with zero new logic, just shown modally instead of as the tab root. */}
      <Stack.Screen name="CategoryProducts" component={HomeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading } = useAuth();

  // Blank, not another logo+spinner splash — the App-level splash sequence already
  // covers this brief moment; a second competing splash here caused it to visually
  // linger/overlap after the main sequence finished.
  if (isLoading) {
    return <View style={styles.splash} />;
  }

  // Browsing is open to everyone; sign-in is only required to complete a purchase.
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});

const tabStyles = StyleSheet.create({
  homeIcon: {
    width: 22,
    height: 22,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
