import React, { useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import SelectionGrid from '../components/SelectionGrid';
import StepIndicator from '../components/StepIndicator';
import { STEPS } from '../constants';
import { AppStep, Option, Selection } from '../types';

const STEP_GRADIENTS: Record<AppStep, [string, string]> = {
  'select-animal': ['#FF9A9E', '#FAD0C4'],
  'select-scene': ['#A1C4FD', '#C2E9FB'],
  'select-outfit': ['#D4FC79', '#96E6A1'],
  'select-style': ['#FDDB92', '#D1FDFF'],
  reveal: ['#667EEA', '#764BA2'],
  draw: ['#F093FB', '#F5576C'],
};

const STEP_HEADER_EMOJIS: Record<AppStep, string> = {
  'select-animal': '🦁',
  'select-scene': '🌴',
  'select-outfit': '👑',
  'select-style': '🎨',
  reveal: '✨',
  draw: '🖌️',
};

interface Props {
  step: AppStep;
  selection: Selection;
  onSelect: (option: Option) => void;
  onBack: () => void;
  canGoBack: boolean;
}

const SELECTION_STEPS: AppStep[] = [
  'select-animal',
  'select-scene',
  'select-outfit',
  'select-style',
];

export default function SelectionScreen({
  step,
  selection,
  onSelect,
  onBack,
  canGoBack,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const stepData = STEPS.find((s) => s.step === step);
  const gradients = STEP_GRADIENTS[step] ?? ['#A1C4FD', '#C2E9FB'];
  const headerEmoji = STEP_HEADER_EMOJIS[step] ?? '❓';

  const stepIndex = SELECTION_STEPS.indexOf(step);
  const currentSelected = (() => {
    if (step === 'select-animal') return selection.animal?.id;
    if (step === 'select-scene') return selection.scene?.id;
    if (step === 'select-outfit') return selection.outfit?.id;
    if (step === 'select-style') return selection.style?.id;
    return null;
  })();

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack();
  }, [onBack]);

  return (
    <LinearGradient colors={gradients} style={styles.container}>
      {/* Header row: back button + step indicator */}
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backEmoji}>◀️</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        <StepIndicator currentStep={step} />

        {/* Header emoji - decorative */}
        <View style={styles.backBtnPlaceholder}>
          <Text style={styles.headerEmoji}>{headerEmoji}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {stepData && (
          <SelectionGrid
            options={stepData.options}
            onSelect={onSelect}
            selectedId={currentSelected}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 8,
  },
  headerLandscape: {
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  backBtnPlaceholder: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backEmoji: {
    fontSize: 24,
  },
  headerEmoji: {
    fontSize: 32,
  },
  gridContainer: {
    flex: 1,
  },
});
