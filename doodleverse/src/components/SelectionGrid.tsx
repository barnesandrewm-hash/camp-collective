import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import EmojiTile from './EmojiTile';
import { Option } from '../types';

const TILE_COLORS = [
  '#FFF3CD', '#D4EDDA', '#D1ECF1', '#F8D7DA',
  '#E2D9F3', '#FFEEBA', '#D6EAF8', '#FDEDEC',
  '#D5F5E3', '#FDEBD0', '#EBF5FB', '#F9EBEA',
];

interface Props {
  options: Option[];
  onSelect: (option: Option) => void;
  selectedId?: string | null;
  categoryColor?: string;
}

export default function SelectionGrid({
  options,
  onSelect,
  selectedId,
  categoryColor,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Tablet landscape gets bigger tiles; phone gets smaller
  const cols = isLandscape ? 6 : 4;
  const availableWidth = width - 32;
  const tileSize = Math.floor(availableWidth / cols) - 12;
  const clampedSize = Math.min(Math.max(tileSize, 64), 130);

  return (
    <ScrollView
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        {options.map((option, i) => (
          <EmojiTile
            key={option.id}
            option={option}
            onSelect={onSelect}
            tileSize={clampedSize}
            isSelected={option.id === selectedId}
            backgroundColor={categoryColor ?? TILE_COLORS[i % TILE_COLORS.length]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
