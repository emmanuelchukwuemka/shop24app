import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashSequence from './src/components/SplashSequence';

// Keep the native splash (app.json -> expo-splash-screen) up until our first
// JS frame has committed, then hand off to it immediately below.
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootGate() {
  const { isLoading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashSequence authReady={!authLoading} onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    // First JS frame is committed (our own red splash is now on screen) —
    // safe to drop the native splash right away.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RootGate />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
