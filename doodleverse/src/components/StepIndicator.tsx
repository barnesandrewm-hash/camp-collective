import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppStep } from '../types';
import { STEPS } from '../constants';

interface Props {
  currentStep: AppStep;
}

const STEP_ORDER: AppStep[] = [
  'select-animal',
  'select-scene',
  'select-outfit',
  'select-style',
];

export default function StepIndicator({ currentStep }: Props) {
  const currentIndex = STEP_ORDER.indexOf(currentStep as AppStep);

  return (
    <View style={styles.container}>
      {STEPS.map((s, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <React.Fragment key={s.step}>
            <View
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isDone && styles.dotDone,
              ]}
            >
              <Text style={[styles.dotEmoji, isActive && styles.dotEmojiActive]}>
                {s.emoji}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.line, isDone && styles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFD700',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  dotDone: {
    backgroundColor: 'rgba(255,215,0,0.5)',
    borderColor: '#FFD700',
  },
  dotEmoji: {
    fontSize: 26,
    opacity: 0.55,
  },
  dotEmojiActive: {
    opacity: 1,
    fontSize: 30,
  },
  line: {
    width: 36,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  lineDone: {
    backgroundColor: '#FFD700',
  },
});
