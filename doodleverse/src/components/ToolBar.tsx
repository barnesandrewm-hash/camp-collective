import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import ColorPicker from './ColorPicker';
import { BRUSH_SIZES } from '../constants';

interface Props {
  color: string;
  brushSize: number;
  canUndo: boolean;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

const BRUSH_EMOJIS = ['🖊️', '✒️', '🖋️', '🖌️'];

export default function ToolBar({
  color,
  brushSize,
  canUndo,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onClear,
  onSave,
  isSaving = false,
}: Props) {
  const haptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      {/* Brush sizes */}
      <View style={styles.brushRow}>
        {BRUSH_SIZES.map((size, i) => (
          <TouchableOpacity
            key={size}
            onPress={() => { haptic(); onBrushSizeChange(size); }}
            style={[
              styles.brushBtn,
              size === brushSize && styles.brushBtnActive,
            ]}
            accessibilityLabel={`Brush size ${size}`}
          >
            <Text style={styles.brushEmoji}>{BRUSH_EMOJIS[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color swatches */}
      <View style={styles.colorRow}>
        <ColorPicker selectedColor={color} onColorSelect={(c) => { haptic(); onColorChange(c); }} />
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => { haptic(); onUndo(); }}
          style={[styles.actionBtn, !canUndo && styles.actionBtnDisabled]}
          disabled={!canUndo}
          accessibilityLabel="Undo"
        >
          <Text style={styles.actionEmoji}>↩️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { haptic(); onClear(); }}
          style={styles.actionBtn}
          accessibilityLabel="Clear canvas"
        >
          <Text style={styles.actionEmoji}>🗑️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { haptic(); onSave(); }}
          style={[styles.actionBtn, styles.saveBtn]}
          accessibilityLabel="Save drawing"
        >
          <Text style={styles.actionEmoji}>{isSaving ? '⏳' : '💾'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    paddingTop: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
    gap: 10,
  },
  brushRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  brushBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brushBtnActive: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFD700',
  },
  brushEmoji: {
    fontSize: 24,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  saveBtn: {
    backgroundColor: '#D4EDDA',
    borderWidth: 2,
    borderColor: '#28A745',
  },
  actionEmoji: {
    fontSize: 26,
  },
});
