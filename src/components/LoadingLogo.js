import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

// A calmer, on-brand loading state — a gently pulsing logo instead of a bare spinner.
export default function LoadingLogo({ size = 64 }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        resizeMode="contain"
        style={{ width: size, height: size, opacity: pulse }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
