import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';

// Small on-brand confirmation that slides up, sits briefly, then dismisses
// itself — no tap required. Replaces the plain native Alert.alert() pattern
// for routine, non-blocking feedback like "added to cart".
export default function Toast({ visible, message, onHide, duration = 2000, bottom = 100 }) {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 40, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { bottom, transform: [{ translateY }], opacity }]}
    >
      <CheckCircle size={20} color={COLORS.success} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    ...SHADOWS.medium,
    zIndex: 999,
  },
  text: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.size.sm + 1,
    fontWeight: '600',
    color: COLORS.text,
  },
});
