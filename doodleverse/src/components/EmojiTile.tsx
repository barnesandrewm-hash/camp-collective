import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Option } from '../types';

interface Props {
  option: Option;
  onSelect: (option: Option) => void;
  tileSize: number;
  isSelected?: boolean;
  backgroundColor?: string;
}

export default function EmojiTile({
  option,
  onSelect,
  tileSize,
  isSelected = false,
  backgroundColor = '#FFFFFF',
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.18,
        useNativeDriver: true,
        speed: 80,
        bounciness: 8,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 14,
      }),
    ]).start(() => onSelect(option));
  }, [scale, onSelect, option]);

  const fontSize = tileSize * 0.48;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityLabel={option.label}
      accessibilityRole="button"
    >
      <Animated.View
        style={[
          styles.tile,
          {
            width: tileSize,
            height: tileSize,
            backgroundColor,
            borderRadius: tileSize * 0.22,
            transform: [{ scale }],
            borderWidth: isSelected ? 4 : 0,
            borderColor: '#FFD700',
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize }]}>{option.emoji}</Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    margin: 6,
  },
  emoji: {
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#000',
    fontWeight: '900',
  },
});
