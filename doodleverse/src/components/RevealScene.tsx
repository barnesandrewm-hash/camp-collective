import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Selection } from '../types';
import { SCENE_GRADIENTS, STYLE_OPACITY } from '../constants';

interface Props {
  selection: Selection;
}

const SCENE_DECORATIONS: Record<string, string[]> = {
  beach: ['🌊', '🏄', '🐚', '☀️'],
  forest: ['🌿', '🍃', '🍀', '🌾'],
  mountains: ['❄️', '🦅', '⛰️', '🌨️'],
  ocean: ['🐠', '🐋', '🦀', '🐙'],
  space: ['⭐', '🌟', '🪐', '🛸'],
  rainbow: ['🌦️', '💧', '☁️', '🌤️'],
  garden: ['🦋', '🐝', '🌻', '🌹'],
  castle: ['🏰', '🗡️', '🛡️', '🐉'],
  jungle: ['🦜', '🐍', '🌿', '🐆'],
  volcano: ['🔥', '💥', '🌋', '🪨'],
  cave: ['🦇', '💎', '🔦', '🕯️'],
  fairground: ['🎠', '🎪', '🎟️', '🎆'],
};

export default function RevealScene({ selection }: Props) {
  const { width, height } = useWindowDimensions();
  const sceneId = selection.scene?.id ?? 'beach';
  const styleId = selection.style?.id ?? 'watercolor';
  const colors = SCENE_GRADIENTS[sceneId] ?? ['#87CEEB', '#FFD700'];
  const opacity = STYLE_OPACITY[styleId] ?? 0.9;
  const decorations = SCENE_DECORATIONS[sceneId] ?? ['⭐', '🌟', '✨', '💫'];

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        delay: 200,
        useNativeDriver: true,
        speed: 6,
        bounciness: 16,
      }),
    ]).start();
  }, []);

  const isLandscape = width > height;
  const animalSize = isLandscape ? Math.min(height * 0.38, 180) : Math.min(width * 0.38, 160);
  const outfitSize = animalSize * 0.55;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[colors[0], colors[1], colors[0] + '88']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill]}
      />

      {/* Corner decorations */}
      {decorations.map((deco, i) => (
        <Text
          key={i}
          style={[
            styles.decoration,
            DECO_POSITIONS[i % 4],
            { opacity: opacity * 0.7 },
          ]}
        >
          {deco}
        </Text>
      ))}

      {/* Main character */}
      <Animated.View
        style={[
          styles.characterContainer,
          {
            transform: [
              { scale: bounceAnim },
            ],
          },
        ]}
      >
        {/* Animal */}
        <Text style={[styles.animalEmoji, { fontSize: animalSize }]}>
          {selection.animal?.emoji ?? '🦄'}
        </Text>

        {/* Outfit overlaid top-right of animal */}
        <Text
          style={[
            styles.outfitEmoji,
            {
              fontSize: outfitSize,
              top: -outfitSize * 0.4,
              right: -outfitSize * 0.2,
            },
          ]}
        >
          {selection.outfit?.emoji ?? '👑'}
        </Text>
      </Animated.View>

      {/* Style badge */}
      <View style={styles.styleBadge}>
        <Text style={styles.styleEmoji}>{selection.style?.emoji ?? '🎨'}</Text>
      </View>
    </Animated.View>
  );
}

const DECO_POSITIONS = [
  { top: 20, left: 20 },
  { top: 20, right: 20 },
  { bottom: 20, left: 20 },
  { bottom: 20, right: 20 },
] as const;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  decoration: {
    position: 'absolute',
    fontSize: 42,
  },
  characterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animalEmoji: {
    textAlign: 'center',
  },
  outfitEmoji: {
    position: 'absolute',
    textAlign: 'center',
  },
  styleBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    padding: 8,
  },
  styleEmoji: {
    fontSize: 28,
  },
});
