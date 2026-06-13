import { Option } from '../types';

export const ANIMALS: Option[] = [
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'frog', emoji: '🐸', label: 'Frog' },
  { id: 'monkey', emoji: '🐒', label: 'Monkey' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
];

export const SCENES: Option[] = [
  { id: 'beach', emoji: '🏖️', label: 'Beach' },
  { id: 'forest', emoji: '🌲', label: 'Forest' },
  { id: 'mountains', emoji: '🏔️', label: 'Mountains' },
  { id: 'ocean', emoji: '🌊', label: 'Ocean' },
  { id: 'space', emoji: '🌙', label: 'Space' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'garden', emoji: '🌸', label: 'Garden' },
  { id: 'castle', emoji: '🏰', label: 'Castle' },
  { id: 'jungle', emoji: '🌴', label: 'Jungle' },
  { id: 'volcano', emoji: '🌋', label: 'Volcano' },
  { id: 'cave', emoji: '🍄', label: 'Cave' },
  { id: 'fairground', emoji: '🎡', label: 'Fairground' },
];

export const OUTFITS: Option[] = [
  { id: 'crown', emoji: '👑', label: 'Crown' },
  { id: 'tophat', emoji: '🎩', label: 'Top Hat' },
  { id: 'beanie', emoji: '🧢', label: 'Beanie' },
  { id: 'bow', emoji: '🎀', label: 'Bow' },
  { id: 'glasses', emoji: '👓', label: 'Glasses' },
  { id: 'scarf', emoji: '🧣', label: 'Scarf' },
  { id: 'umbrella', emoji: '🌂', label: 'Umbrella' },
  { id: 'flower', emoji: '🌺', label: 'Flower' },
  { id: 'superhero', emoji: '🦸', label: 'Superhero' },
  { id: 'mask', emoji: '🎭', label: 'Mask' },
  { id: 'ribbon', emoji: '🎗️', label: 'Ribbon' },
  { id: 'star', emoji: '⭐', label: 'Star' },
];

export const ART_STYLES: Option[] = [
  { id: 'watercolor', emoji: '🎨', label: 'Watercolor' },
  { id: 'crayon', emoji: '🖍️', label: 'Crayon' },
  { id: 'pencil', emoji: '✏️', label: 'Pencil' },
  { id: 'paint', emoji: '🖌️', label: 'Paint' },
  { id: 'rainbow', emoji: '🌈', label: 'Rainbow' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'neon', emoji: '💫', label: 'Neon' },
  { id: 'pixel', emoji: '🎮', label: 'Pixel' },
];

export const STEPS = [
  { step: 'select-animal' as const, emoji: '🦁', options: ANIMALS },
  { step: 'select-scene' as const, emoji: '🌴', options: SCENES },
  { step: 'select-outfit' as const, emoji: '👑', options: OUTFITS },
  { step: 'select-style' as const, emoji: '🎨', options: ART_STYLES },
];

export const SCENE_GRADIENTS: Record<string, [string, string]> = {
  beach: ['#FFD700', '#87CEEB'],
  forest: ['#228B22', '#90EE90'],
  mountains: ['#8B9DC3', '#D4E6F1'],
  ocean: ['#006994', '#48CAE4'],
  space: ['#0D0D2B', '#4B0082'],
  rainbow: ['#FF6B9D', '#FFE66D'],
  garden: ['#FF9FF3', '#A8E6CF'],
  castle: ['#9B59B6', '#D7BDE2'],
  jungle: ['#1A5C38', '#76B947'],
  volcano: ['#CC2200', '#FF6600'],
  cave: ['#2C3E50', '#7F8C8D'],
  fairground: ['#FF1493', '#FFD700'],
};

export const STYLE_OPACITY: Record<string, number> = {
  watercolor: 0.75,
  crayon: 0.9,
  pencil: 0.85,
  paint: 1.0,
  rainbow: 0.9,
  sparkle: 0.85,
  neon: 1.0,
  pixel: 0.95,
};

export const DRAW_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC02', '#34C759',
  '#007AFF', '#AF52DE', '#FF2D55', '#FFFFFF',
  '#000000', '#8E8E93', '#A2845E', '#00C7BE',
];

export const BRUSH_SIZES = [4, 8, 14, 22];
