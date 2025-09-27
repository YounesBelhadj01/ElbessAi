export interface ImageFile {
  id: string;
  file: File;
  dataUrl: string;
}

export interface ColorGroup {
  id: string;
  name: string;
  images: ImageFile[];
  pose: string; // Each color group can now have a specific pose
}

export interface ModelPresets {
  gender: string;
  skinTone: string;
  hair: string;
  hairstyle: string;
  age: number;
  pose: string;
  selectedFaceUrl: string | null;
}

export interface MannequinPresets {
  material: string;
  age: number;
  hair: string;
  gender: string;
}

export interface HangerPresets {
  type: string;
}

export interface StylePresets {
  category: string;
  option: string;
}

export interface Presets {
  object: string;
  style: StylePresets;
  model: ModelPresets;
  mannequin: MannequinPresets;
  hanger: HangerPresets;
  customInstructions: string;
}

export interface GeneratedResult {
  sourceImageId: string;
  generatedImageUrl: string;
  prompt: string;
}