export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  TREE = 'Tree',
  FIREWORKS = 'Fireworks',
  BOW = 'Bow'
}

export interface ParticleConfig {
  count: number;
  color: string;
  shape: ShapeType;
}

export interface HandGestureData {
  isOpen: boolean;
  openness: number; // 0.0 to 1.0 (closed to open)
  position: { x: number; y: number }; // Normalized screen coordinates
  isDetected: boolean;
  isPointing: boolean; // New: detects if user is using one finger
  pointerPosition: { x: number; y: number }; // New: specific coordinates of the index finger
}