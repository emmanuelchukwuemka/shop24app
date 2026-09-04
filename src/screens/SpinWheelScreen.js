import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Animated,
  Easing,
  Modal,
  Alert
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Trophy, Gift, ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../styles/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const PRIZES = [
  '₦1,000 Coupon',
  'Free Shipping',
  '90% OFF Code',
  '₦5,000 Coupon',
  '10% Cashback',
  '₦2,500 Coupon',
  'No Luck Today',
  '₦10,000 Gift'
];

export default function SpinWheelScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winningPrize, setWinningPrize] = useState('');
  const [wonCouponCode, setWonCouponCode] = useState('');

  const spinValue = useRef(new Animated.Value(0)).current;

  const spinTheWheel = async () => {
    if (spinning) return;

    if (!user) {
      Alert.alert(
        'Sign in required',
        'Please sign in to spin the wheel and win a real coupon.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    setSpinning(true);
    let result;
    try {
      result = await api.spinWheel();
    } catch (e) {
      setSpinning(false);
      Alert.alert('Come back later', e.message || 'Could not spin the wheel right now.');
      return;
    }

    spinValue.setValue(0);
    const segments = PRIZES.length;
    const targetDeg = 1800 + (result.prize_index * (360 / segments));

    Animated.timing(spinValue, {
      toValue: targetDeg,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSpinning(false);
      setWinningPrize(result.prize_label);
      setWonCouponCode(result.coupon_code);
      setShowModal(true);
    });
  };

  const spinInterpolation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background Graphic elements */}
      <View style={styles.topRibbon}>
        <Sparkles size={18} color={COLORS.accent} />
        <Text style={styles.ribbonText}>TEMU DAILY REWARDS</Text>
        <Sparkles size={18} color={COLORS.accent} />
      </View>

      <Text style={styles.title}>Spin & Win Voucher</Text>
      <Text style={styles.subtitle}>Win up to ₦10,000 coupons for your shopping cart!</Text>

      {/* Wheel Graphic */}
      <View style={styles.wheelContainer}>
        {/* Pointer */}
        <View style={styles.pointer} />

        <Animated.View 
          style={[
            styles.wheel, 
            { transform: [{ rotate: spinInterpolation }] }
          ]}
        >
          {/* We style the wheel background with beautiful segment dividers or simple color wheel */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400' }}
            style={styles.wheelBackgroundImage}
            cachePolicy="memory-disk"
          />
          <View style={styles.wheelInner}>
            {PRIZES.map((prize, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.segment, 
                  { transform: [{ rotate: `${idx * 45}deg` }] }
                ]}
              >
                <Text style={styles.segmentText} numberOfLines={1}>{prize}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
        
        {/* Central Spin Button Pin */}
        <TouchableOpacity 
          style={styles.centerButton}
          onPress={spinTheWheel}
          disabled={spinning}
          activeOpacity={0.9}
        >
          <Text style={styles.centerButtonText}>{spinning ? 'SPINNING' : 'SPIN'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Trophy size={20} color={COLORS.primary} />
        <View style={styles.infoCardTextContainer}>
          <Text style={styles.infoCardTitle}>100% Guaranteed Win</Text>
          <Text style={styles.infoCardDesc}>Every user gets 1 free spin daily. Coupons apply instantly to your cart.</Text>
        </View>
      </View>

      {/* WIN MODAL */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=300' }}
              style={styles.giftBoxImage}
              cachePolicy="memory-disk"
            />
            <Text style={styles.modalCongrat}>CONGRATULATIONS!</Text>
            <Text style={styles.modalWinning}>You won: <Text style={styles.prizeHighlight}>{winningPrize}</Text></Text>
            
            <View style={styles.couponCodeBox}>
              <Text style={styles.couponLabel}>YOUR VOUCHER CODE:</Text>
              <Text style={styles.couponCode}>{wonCouponCode}</Text>
            </View>

            <Text style={styles.modalNote}>Use this coupon on checkout to claim your reward!</Text>

            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={() => {
                setShowModal(false);
                navigation.navigate('CartTab');
              }}
            >
              <Text style={styles.claimBtnText}>Go to Cart & Apply</Text>
              <ArrowRight size={16} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeBtn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeBtnText}>Spin Again Tomorrow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5D9', // Soft peach bg for spin screen
    alignItems: 'center',
  },
  topRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  ribbonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.xs,
    marginHorizontal: SPACING.xs,
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontWeight: '900',
    color: COLORS.secondary,
    marginTop: SPACING.lg,
  },
  subtitle: {
    fontSize: FONTS.size.xs + 1,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  wheelContainer: {
    position: 'relative',
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  pointer: {
    position: 'absolute',
    top: -12,
    zIndex: 10,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.secondary,
  },
  wheel: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    borderWidth: 8,
    borderColor: '#FFB84D',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    ...SHADOWS.medium,
  },
  wheelBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.15,
  },
  wheelInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 15,
  },
  segmentText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.text,
    width: 68,
    textAlign: 'center',
    lineHeight: 11,
  },
  centerButton: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.secondary,
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    ...SHADOWS.medium,
  },
  centerButtonText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: FONTS.size.sm,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 10,
    width: '90%',
    marginTop: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.light,
  },
  infoCardTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  infoCardTitle: {
    fontWeight: 'bold',
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  infoCardDesc: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 300,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  giftBoxImage: {
    width: 100,
    height: 100,
    marginBottom: SPACING.sm,
  },
  modalCongrat: {
    fontSize: FONTS.size.lg,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  modalWinning: {
    fontSize: FONTS.size.sm + 1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  prizeHighlight: {
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  couponCodeBox: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: COLORS.couponBorder,
    borderStyle: 'dashed',
    borderRadius: 8,
    width: '100%',
    padding: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  couponLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  couponCode: {
    fontSize: FONTS.size.xl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    letterSpacing: 2,
    marginTop: 2,
  },
  modalNote: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  claimBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: SPACING.sm,
  },
  claimBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.size.sm + 1,
    marginRight: 6,
  },
  closeBtn: {
    paddingVertical: 8,
  },
  closeBtnText: {
    color: COLORS.textMuted,
    fontSize: FONTS.size.xs,
  },
});
