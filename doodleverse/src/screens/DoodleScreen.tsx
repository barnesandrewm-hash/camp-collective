import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCanvasRef } from '@shopify/react-native-skia';
import RevealScene from '../components/RevealScene';
import DrawingCanvas from '../components/DrawingCanvas';
import ToolBar from '../components/ToolBar';
import { DrawStroke, Selection } from '../types';
import { saveDrawingToGallery } from '../utils/saveDrawing';
import { BRUSH_SIZES, DRAW_COLORS } from '../constants';

interface Props {
  selection: Selection;
  onRestart: () => void;
}

export default function DoodleScreen({ selection, onRestart }: Props) {
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDoodling, setIsDoodling] = useState(false);
  const canvasRef = useCanvasRef();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const revealAnim = useRef(new Animated.Value(1)).current;

  const handleStrokeAdded = useCallback((stroke: DrawStroke) => {
    setStrokes((prev) => [...prev, stroke]);
    if (!isDoodling) setIsDoodling(true);
  }, [isDoodling]);

  const handleUndo = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setStrokes([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaving(true);
    try {
      if (canvasRef.current) {
        const image = canvasRef.current.makeImageSnapshot();
        const base64 = image.encodeToBase64();
        const result = await saveDrawingToGallery(base64);
        if (result.success) {
          Alert.alert('🎉', '');
        } else if (result.error === 'no-permission') {
          Alert.alert('📷❌', '');
        }
      }
    } catch {
      // silent fail — save unavailable in Expo Go simulator
    } finally {
      setIsSaving(false);
    }
  }, [canvasRef]);

  const handleRestart = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Animated.sequence([
      Animated.timing(revealAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStrokes([]);
      onRestart();
    });
  }, [revealAnim, onRestart]);

  return (
    <Animated.View style={[styles.container, { opacity: revealAnim }]}>
      {/* Background scene */}
      <View style={styles.sceneContainer}>
        <RevealScene selection={selection} />

        {/* Drawing layer overlaid on scene */}
        <DrawingCanvas
          color={color}
          strokeWidth={brushSize}
          strokes={strokes}
          onStrokeAdded={handleStrokeAdded}
          canvasRef={canvasRef}
        />

        {/* Restart button — top-left */}
        <TouchableOpacity
          onPress={handleRestart}
          style={styles.restartBtn}
          accessibilityLabel="Start over"
        >
          <Text style={styles.restartEmoji}>🏠</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar at bottom */}
      <ToolBar
        color={color}
        brushSize={brushSize}
        canUndo={strokes.length > 0}
        onColorChange={setColor}
        onBrushSizeChange={setBrushSize}
        onUndo={handleUndo}
        onClear={handleClear}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sceneContainer: {
    flex: 1,
    position: 'relative',
  },
  restartBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 100,
  },
  restartEmoji: {
    fontSize: 26,
  },
});
