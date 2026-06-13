import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import { DrawStroke } from '../types';

interface Props {
  color: string;
  strokeWidth: number;
  strokes: DrawStroke[];
  onStrokeAdded: (stroke: DrawStroke) => void;
  canvasRef?: React.RefObject<any>;
}

function buildSkiaPath(points: { x: number; y: number }[]) {
  if (points.length < 1) return null;
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    path.quadTo(prev.x, prev.y, mx, my);
  }
  const last = points[points.length - 1];
  if (points.length > 1) path.lineTo(last.x, last.y);
  return path;
}

export default function DrawingCanvas({
  color,
  strokeWidth,
  strokes,
  onStrokeAdded,
  canvasRef: externalRef,
}: Props) {
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const internalRef = useCanvasRef();
  const resolvedRef = externalRef ?? internalRef;

  // Keep latest values accessible inside the stable PanResponder callback
  const colorRef = useRef(color);
  const strokeWidthRef = useRef(strokeWidth);
  const onStrokeAddedRef = useRef(onStrokeAdded);
  colorRef.current = color;
  strokeWidthRef.current = strokeWidth;
  onStrokeAddedRef.current = onStrokeAdded;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const pt = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
        pointsRef.current = [pt];
        setCurrentPoints([pt]);
      },
      onPanResponderMove: (e) => {
        const pts = [
          ...pointsRef.current,
          { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY },
        ];
        pointsRef.current = pts;
        setCurrentPoints(pts);
      },
      onPanResponderRelease: () => {
        if (pointsRef.current.length > 1) {
          onStrokeAddedRef.current({
            points: [...pointsRef.current],
            color: colorRef.current,
            strokeWidth: strokeWidthRef.current,
          });
        }
        pointsRef.current = [];
        setCurrentPoints([]);
      },
    })
  ).current;

  const currentPath = buildSkiaPath(currentPoints);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill} ref={resolvedRef}>
        {strokes.map((stroke, i) => {
          const path = buildSkiaPath(stroke.points);
          if (!path) return null;
          return (
            <Path
              key={i}
              path={path}
              color={stroke.color}
              style="stroke"
              strokeWidth={stroke.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          );
        })}
        {currentPath && (
          <Path
            path={currentPath}
            color={color}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
          />
        )}
      </Canvas>

      {/* Transparent view captures touch, Canvas is pointer-events-free */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
    </View>
  );
}
