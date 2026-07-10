import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, FONTS } from '../styles/theme';

export default function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference <= 0) {
        return { hours: '00', minutes: '00', seconds: '00' };
      }

      let hours = Math.floor(difference / (1000 * 60 * 60));
      let minutes = Math.floor((difference / 1000 / 60) % 60);
      let seconds = Math.floor((difference / 1000) % 60);

      return {
        hours: hours < 10 ? `0${hours}` : `${hours}`,
        minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
        seconds: seconds < 10 ? `0${seconds}` : `${seconds}`,
      };
    };

    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <View style={styles.container}>
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{timeLeft.hours}</Text>
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{timeLeft.minutes}</Text>
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{timeLeft.seconds}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBox: {
    backgroundColor: '#222222',
    borderRadius: 4,
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  colon: {
    color: '#222222',
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    marginHorizontal: 3,
  },
});
