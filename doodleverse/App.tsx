import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SelectionScreen from './src/screens/SelectionScreen';
import DoodleScreen from './src/screens/DoodleScreen';
import { AppStep, Option, Selection } from './src/types';

const INITIAL_SELECTION: Selection = {
  animal: null,
  scene: null,
  outfit: null,
  style: null,
};

const STEP_ORDER: AppStep[] = [
  'select-animal',
  'select-scene',
  'select-outfit',
  'select-style',
  'reveal',
];

export default function App() {
  const [step, setStep] = useState<AppStep>('select-animal');
  const [selection, setSelection] = useState<Selection>(INITIAL_SELECTION);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = useCallback(
    (nextStep: AppStep, updatedSelection?: Selection) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Update state after fade-out starts but before fade-in
      setTimeout(() => {
        if (updatedSelection) setSelection(updatedSelection);
        setStep(nextStep);
      }, 150);
    },
    [fadeAnim]
  );

  const handleSelect = useCallback(
    (option: Option) => {
      const updated = { ...selection };

      if (step === 'select-animal') {
        updated.animal = option;
        transitionTo('select-scene', updated);
      } else if (step === 'select-scene') {
        updated.scene = option;
        transitionTo('select-outfit', updated);
      } else if (step === 'select-outfit') {
        updated.outfit = option;
        transitionTo('select-style', updated);
      } else if (step === 'select-style') {
        updated.style = option;
        transitionTo('reveal', updated);
      }
    },
    [step, selection, transitionTo]
  );

  const handleBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) {
      transitionTo(STEP_ORDER[idx - 1] as AppStep);
    }
  }, [step, transitionTo]);

  const handleRestart = useCallback(() => {
    transitionTo('select-animal', INITIAL_SELECTION);
  }, [transitionTo]);

  const canGoBack = STEP_ORDER.indexOf(step) > 0;
  const isDrawing = step === 'reveal';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.View style={[styles.screen, { opacity: fadeAnim }]}>
        {isDrawing ? (
          <DoodleScreen selection={selection} onRestart={handleRestart} />
        ) : (
          <SelectionScreen
            step={step}
            selection={selection}
            onSelect={handleSelect}
            onBack={handleBack}
            canGoBack={canGoBack}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});
