import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import { COLORS } from '../styles/theme';

// Shopping over a slow/flaky connection means product images sometimes fail to load.
// Instead of leaving a blank gap where an <Image> silently gives up, show a clear placeholder.
export default function FallbackImage({ uri, style, resizeMode = 'cover', iconSize = 24 }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={[style, styles.placeholder]}>
        <ImageOff size={iconSize} color={COLORS.textMuted} strokeWidth={1.5} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
