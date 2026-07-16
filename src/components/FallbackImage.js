import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { COLORS } from '../styles/theme';

// Shopping over a slow/flaky connection means product images sometimes fail to load,
// and even on a good connection there's a real gap before an image finishes downloading.
// Show the brand placeholder for both cases instead of a blank box.
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
        resizeMode={resizeMode}
        onLoadEnd={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {!loaded && (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Image
            source={require('../../assets/logo.png')}
            resizeMode="contain"
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
    width: '40%',
    height: '40%',
    opacity: 0.5,
  },
});
