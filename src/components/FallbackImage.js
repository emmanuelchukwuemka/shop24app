import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { COLORS } from '../styles/theme';

// Shopping over a slow/flaky connection means product images sometimes fail to load,
// and even on a good connection there's a real gap before an image finishes downloading.
// Show the brand placeholder for both cases instead of a blank box.
//
// Uses expo-image (not RN's core Image) specifically for its disk cache — RN's core
// Image doesn't reliably persist across app restarts on Android, so without this every
// screen re-downloads product/category images from the server every single time. With
// cachePolicy="memory-disk", an image already seen loads instantly from disk instead.
export default function FallbackImage({ uri, style, resizeMode = 'cover', iconSize = 24 }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!uri || failed) {
    return (
      <View style={[style, styles.placeholder]}>
        <ImageOff size={iconSize} color={COLORS.textMuted} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <View style={[style, styles.clip]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit={resizeMode}
        cachePolicy="memory-disk"
        onLoadEnd={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Image
            source={require('../../assets/logo.png')}
            contentFit="contain"
            tintColor={COLORS.textMuted}
            style={styles.loadingLogo}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: '25%',
    height: '25%',
    opacity: 0.3,
  },
});
