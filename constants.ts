import type { Presets } from './types';

export const OBJECT_OPTIONS = ['Human model', 'Mannequin', 'Hanger', 'Flat lay', 'Floating effect'];

export const STYLE_OPTIONS = {
  'Studio': ['White seamless', 'Gradient background', 'Spotlight effect', 'With props (chair, cube, plants, mirror)'],
  'Clothing shop': ['On racks', 'Folded on shelves', 'With accessories', 'Boutique interior'],
  'Lifestyle': ['Outdoors (beach, park, street)', 'Indoors (living room, coffee shop)', 'Urban rooftop', 'Cozy cafe'],
  'Creative/Trendy': ['Magazine editorial', 'Social media aesthetic', 'Fantasy zone', 'E-commerce standard'],
};

export const MODEL_GENDERS = ['Female', 'Male', 'Non-binary'];
export const MODEL_SKIN_TONES = ['Light', 'Medium', 'Dark'];
export const MODEL_HAIR_COLORS = ['Black', 'Blonde', 'Brown', 'Red', 'Grey', 'Custom'];

export const HAIRSTYLE_LIBRARY = {
  'Female': {
    'Light': ['Long and straight', 'Wavy bob', 'Elegant updo', 'Messy bun', 'High ponytail', 'Long loose waves', 'Shoulder-length cut', 'Pixie cut'],
    'Medium': ['Long loose waves', 'Shoulder-length cut', 'Sleek ponytail', 'Wavy bob', 'Messy bun', 'Long and straight', 'Curtain bangs'],
    'Dark': ['Afro', 'Box braids', 'Cornrows', 'Twist out', 'High ponytail', 'Short natural curls', 'Sleek top knot', 'Long dreadlocks'],
  },
  'Male': {
    'Light': ['Short buzz cut', 'Crew cut', 'Slicked back', 'Side part', 'Medium length, textured', 'Pompadour', 'Undercut'],
    'Medium': ['Side part', 'Curly top with fade', 'Slicked back', 'Man bun', 'Short buzz cut', 'Textured quiff'],
    'Dark': ['Short buzz cut', 'High top fade', 'Short dreadlocks', 'Waves', 'Clean shave', 'Twists', 'Cornrows'],
  },
  'Unisex/Non-binary': {
      'Light': ['Undercut', 'Shaved head', 'Asymmetrical cut', 'Medium length and natural', 'Short, spiky', 'Colorful dyed hair'],
      'Medium': ['Undercut', 'Shaved head', 'Medium length and natural', 'Long braids', 'Colorful dyed hair', 'Asymmetrical cut'],
      'Dark': ['Shaved head', 'Undercut', 'Bantu knots', 'Colorful dyed hair', 'Short dreadlocks', 'Asymmetrical cut'],
  },
};

export const POSE_LIBRARY = {
  'Women': [
    'Standing straight, hands on hips',
    'Slight side turn, one hand in pocket',
    'Walking forward, looking sideways',
    'Sitting on a chair, legs crossed',
    'Holding accessory (bag/hat) casually',
  ],
  'Men': [
    'Arms crossed, confident stance',
    'One hand in pocket, slight lean',
    'Walking pose, looking ahead',
    'Sitting on stool, elbows on knees',
    'Adjusting jacket/collar with one hand',
  ],
  'Kids': [
    'Standing with playful smile, hands behind back',
    'Jumping mid-air with open arms',
    'Sitting on ground, crossed legs',
    'Holding toy/prop (balloon, teddy bear)',
    'Walking with arms swinging naturally',
  ],
  'Sport': [
    'Running motion, mid-step',
    'Stretching arms overhead',
    'Squatting with hands on knees',
    'Jumping with both hands up',
    'Boxing stance, fists near face',
  ],
  'Classic / Formal': [
    'Standing straight, neutral expression',
    'Seated at desk/table, professional look',
    'Adjusting tie/scarf',
    'Holding blazer/jacket over shoulder',
    'Hands clasped in front, formal smile',
  ],
  'Relax / Casual': [
    'Leaning against wall with hands in pockets',
    'Sitting on ground with relaxed posture',
    'One hand behind head, casual smile',
    'Walking slowly, head tilted down',
    'Half-turned with natural laugh',
  ],
  'Lifestyle': [
    'Sitting in a café with drink in hand',
    'Walking with shopping bag',
    'Standing with phone in hand',
    'Sitting on steps outdoors, relaxed',
    'Leaning on railing, looking into distance',
  ],
  'Indoor / Home': [
    'Sitting on sofa with legs tucked in',
    'Lying on bed with chin resting on hand',
    'Standing by window looking outside',
    'Sitting at table with hands on coffee mug',
    'Stretching arms while standing barefoot',
  ],
  'Creative / Fashion Editorial': [
    'Dramatic lean forward with intense gaze',
    'Sitting on floor with exaggerated posture',
    'Looking over shoulder, back towards camera',
    'Arms lifted above head in artistic pose',
    'One leg bent on a cube/prop, looking fierce',
  ],
  'Neutral / Catalog': [
    'Straight front view, arms relaxed',
    'Side view (left profile)',
    'Side view (right profile)',
    'Back view, standing still',
    'Three-quarter angle, neutral expression',
  ],
};

export const POSE_CATEGORIES = Object.keys(POSE_LIBRARY);


export const MANNEQUIN_MATERIALS = ['Matte White Plastic', 'Glossy Ceramic', 'Natural Wood', 'Brushed Metal', 'Gold', 'Transparent Glass'];
export const MANNEQUIN_HAIR = ['None', 'Sculpted Black', 'Sculpted Blonde', 'Sculpted Brown'];
export const MANNEQUIN_GENDERS = ['Female', 'Male', 'Unisex'];

export const HANGER_TYPES = ['Wooden', 'Plastic', 'Metallic (Chrome)', 'Metallic (Gold)', 'Metallic (Matte Black)', 'Padded', 'Transparent'];

export const INITIAL_PRESETS: Presets = {
  object: OBJECT_OPTIONS[0],
  style: {
    category: Object.keys(STYLE_OPTIONS)[0],
    option: STYLE_OPTIONS.Studio[0],
  },
  model: {
    gender: MODEL_GENDERS[0],
    skinTone: MODEL_SKIN_TONES[1],
    hair: MODEL_HAIR_COLORS[2],
    hairstyle: HAIRSTYLE_LIBRARY.Female.Medium[0],
    age: 25,
    pose: POSE_LIBRARY.Women[0],
    selectedFaceUrl: null,
  },
  mannequin: {
    material: MANNEQUIN_MATERIALS[0],
    age: 25,
    hair: MANNEQUIN_HAIR[0],
    gender: MANNEQUIN_GENDERS[2],
  },
  hanger: {
    type: HANGER_TYPES[0],
  },
  customInstructions: '',
};