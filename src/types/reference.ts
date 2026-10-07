export type ReferenceView = 'front' | 'side' | 'top';

export interface ReferenceImage {
  id: string;
  view: ReferenceView;
  url: string;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  visible: boolean;
}

export type ReferenceState = Record<ReferenceView, ReferenceImage | null>;