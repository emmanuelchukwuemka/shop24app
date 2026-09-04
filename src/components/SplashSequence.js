import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HOLD_DURATION = 1400; // ms the brand slide stays up before handing off

/**
 * Single full-bleed brand splash (assets/5.png). Shown on every launch,
 * hands off once it's been up for HOLD_DURATION AND the auth session-restore
 * check has resolved — so we never drop straight into a blank screen if
 * that check is still in flight.
 */
export default function SplashSequence({ authReady, onFinish }) {
  const [holdDone, setHoldDone] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setHoldDone(true), HOLD_DURATION);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (holdDone && authReady && !finishedRef.current) {
      finishedRef.current = true;
      onFinish();
    }
  }, [holdDone, authReady, onFinish]);

  return (
    <View style={styles.container}>
      {/* Explicit numeric width/height (not StyleSheet.absoluteFill) — gives
          the image an unambiguous box to fit itself into. */}
      <Image
        source={require('../../assets/5.png')}
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, resizeMode: 'contain' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
