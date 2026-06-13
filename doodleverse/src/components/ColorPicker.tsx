import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { DRAW_COLORS } from '../constants';

interface Props {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export default function ColorPicker({ selectedColor, onColorSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DRAW_COLORS.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onColorSelect(c)}
          style={[
            styles.swatch,
            { backgroundColor: c },
            c === selectedColor && styles.swatchSelected,
            c === '#FFFFFF' && styles.swatchWhite,
          ]}
          accessibilityLabel={`Color ${c}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#FFD700',
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  swatchWhite: {
    borderWidth: 1.5,
    borderColor: '#CCC',
  },
});
