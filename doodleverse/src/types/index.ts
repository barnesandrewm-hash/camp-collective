export interface Option {
  id: string;
  emoji: string;
  label: string;
}

export interface Selection {
  animal: Option | null;
  scene: Option | null;
  outfit: Option | null;
  style: Option | null;
}

export type AppStep =
  | 'select-animal'
  | 'select-scene'
  | 'select-outfit'
  | 'select-style'
  | 'reveal'
  | 'draw';

export interface DrawStroke {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}
