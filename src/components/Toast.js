import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';

// Small on-brand confirmation that pops in at the center of the screen, sits
// briefly, then dismisses itself — no tap required. Replaces the plain native
// Alert.alert() pattern for routine, non-blocking feedback like "added to
// cart". Centered (rather than pinned to a fixed distance from the bottom)
// so it never lands on top of whatever content happens to be on screen at
// that scroll position — it's compact enough to just float over the middle.
export default function Toast({ visible, message, onHide, duration = 1600 }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.9, duration: 160, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }, duration);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <CheckCircle size={17} color={COLORS.success} />
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    maxWidth: '70%',
    ...SHADOWS.medium,
  },
  text: {
    marginLeft: SPACING.sm,
    fontSize: FONTS.size.sm + 1,
    fontWeight: '600',
    color: COLORS.text,
  },
});
