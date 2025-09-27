import { GoogleGenAI, Modality } from "@google/genai";
import type { Presets } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'YOUR_API_KEY_HERE' });

// Make the base64 parsing more robust
const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data.substring(base64Data.indexOf(',') + 1),
      mimeType,
    },
  };
};

export const generateModelFaces = async (
  gender: string,
  skinTone: string,
  hair: string,
  age: number,
  hairstyle: string
): Promise<string[]> => {
  try {
    const model = 'imagen-4.0-generate-001';
    const prompt = `Photorealistic headshot of a ${age}-year-old ${gender} model with ${skinTone} skin and ${hair} hair in a ${hairstyle} style. Centered, looking directly at the camera, neutral expression, studio lighting, plain light grey background.`;
    
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: 3,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);

  } catch (error) {
    console.error("Error generating model faces:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate model faces. ${errorMessage}`);
  }
};

const generatePrompt = (presets: Presets, poseSelectionMode: 'manual' | 'automatic', useReference: boolean = false): string => {
  const clothingInstruction = ` It is of UTMOST IMPORTANCE that you use the EXACT clothing item provided, without ANY modifications to its design, color, texture, or details. Do not alter the clothing. Preserve its original shape, fit, and any logos or graphics perfectly.`;

  if (useReference) {
    // This block handles generating subsequent images using the first one as a reference.
    let prompt = `You are given two images. The first is a reference image showing a scene with a clothing item. The second is an image of a new clothing item. Your task is to replace the clothing item in the reference image with the new clothing item.
It is CRITICAL that you maintain the exact same scene, background, lighting, props, and camera angle from the reference image.
${clothingInstruction}`;

    switch (presets.object) {
      case 'Human model':
        prompt += ` The reference image features a human model. Maintain the exact same model (facial features, hair style, skin tone). The only changes should be the clothing and the model's pose. `;
        if (poseSelectionMode === 'manual') {
          prompt += `The model should adopt this specific pose: "${presets.model.pose}". Generate a new, distinct, and natural version of this pose that is different from the reference image. This could involve changing the position of arms, legs, the angle of the head, or adding a gentle expression like a smile.`;
        } else { // 'automatic'
          prompt += `The model should adopt a new, distinct, and natural pose that is different from the reference image and suitable for the clothing. This could involve changing the position of arms, legs, the angle of the head, or adding a gentle expression like a smile. Ensure the pose variation is significant.`;
        }
        break;
      case 'Mannequin':
        prompt += ` The reference image features a mannequin. Maintain the exact same mannequin. The only change should be the clothing item displayed on it.`;
        break;
      case 'Hanger':
        prompt += ` The reference image features a hanger. Maintain the exact same hanger. The only change should be the clothing item displayed on it.`;
        break;
      case 'Flat lay':
      case 'Floating effect':
        prompt += ` The only change should be swapping the original clothing item for the new one, maintaining the same arrangement and style.`;
        break;
    }

    prompt += `\nDo not simply mirror the image. Isolate the new clothing item and apply it realistically to the scene.`;
    return prompt;
  }

  // This is the original prompt for the first image generation.
  let prompt = '';
  const hasFaceReference = presets.object === 'Human model' && !!presets.model.selectedFaceUrl;
  
  if (hasFaceReference) {
      prompt = `You are given two images: a headshot of a model and an image of a clothing item. Your task is to create a new photorealistic image where the model from the headshot is wearing the clothing item. 
It is CRITICAL to use the exact face and likeness of the model from the headshot.
Place the model in a new scene based on the following instructions.${clothingInstruction} `;
  } else {
      prompt = `Take the clothing item from the user's image, remove the background, and place it in a new, photorealistic scene based on the following instructions.${clothingInstruction} `;
  }


  switch (presets.object) {
    case 'Human model':
      if (!hasFaceReference) {
          prompt += `The clothing should be worn by a photorealistic human model. `;
      }
      prompt += `The model is a ${presets.model.age}-year-old ${presets.model.gender} with a ${presets.model.skinTone} skin tone, and ${presets.model.hair} hair in a ${presets.model.hairstyle} style. `;
      if (poseSelectionMode === 'manual') {
        prompt += `The model should be in a "${presets.model.pose}" pose. `;
      } else { // 'automatic'
        prompt += `The model should be in a natural and dynamic pose that best showcases the clothing item. The pose should be varied and engaging. `;
      }
      break;
    case 'Mannequin':
      prompt += `The clothing should be displayed on a ${presets.mannequin.material} ${presets.mannequin.gender} mannequin suitable for a ${presets.mannequin.age}-year-old's clothing. It has ${presets.mannequin.hair} hair. `;
      break;
    case 'Hanger':
      prompt += `The clothing should be on a single, high-quality ${presets.hanger.type} hanger. `;
      break;
    case 'Flat lay':
      prompt += `The clothing should be arranged in a neat "flat lay" style on a clean surface that complements the background. `;
      break;
    case 'Floating effect':
      prompt += `The clothing should appear to be floating, as if invisible or ghosted, with a 3D effect. `;
      break;
  }

  prompt += `The setting is a "${presets.style.category}" style scene. Specifically, the background should be: "${presets.style.option}". `;
  prompt += `The final image must be of professional, high-end commercial photography quality, with perfect lighting, natural shadows, and ultra-high detail.`;

  if (presets.customInstructions && presets.customInstructions.trim() !== '') {
    prompt += ` Additionally, follow these specific instructions: ${presets.customInstructions.trim()}.`;
  }

  return prompt;
};


export const generateStyledImage = async (
  base64Image: string,
  mimeType: string,
  presets: Presets,
  poseSelectionMode: 'manual' | 'automatic',
  referenceImage?: { dataUrl: string; mimeType: string; }
): Promise<{ imageUrl: string, prompt: string }> => {
  try {
    const model = 'gemini-2.5-flash-image-preview';
    const prompt = generatePrompt(presets, poseSelectionMode, !!referenceImage);
    const clothingImagePart = fileToGenerativePart(base64Image, mimeType);
    
    const parts = [];
    if (referenceImage) {
        // If a reference image is provided, add it as the first part for context.
        const referenceImagePart = fileToGenerativePart(referenceImage.dataUrl, referenceImage.mimeType);
        parts.push(referenceImagePart);
    }
    
    const hasFaceReference = presets.object === 'Human model' && !!presets.model.selectedFaceUrl;
    if (hasFaceReference && presets.model.selectedFaceUrl) {
        const faceMimeType = presets.model.selectedFaceUrl.match(/data:(.*);base64,/)?.[1] || 'image/png';
        const faceImagePart = fileToGenerativePart(presets.model.selectedFaceUrl, faceMimeType);
        parts.push(faceImagePart);
    }

    parts.push(clothingImagePart);
    parts.push({ text: prompt });

    const result = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        return { imageUrl, prompt };
      }
    }
    
    throw new Error("No image was generated. The model may have refused the request.");

  } catch (error) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate image. ${errorMessage}`);
  }
};

export const suggestExportName = async (photoshootContext: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Based on the following clothing photoshoot description, suggest a short, descriptive, file-safe name for a ZIP archive. The name should use dashes or underscores instead of spaces, and contain only letters, numbers, dashes, and underscores.
        
Description: "${photoshootContext}"

Example output: Summer-Collection-Studio-Shoot

Respond with ONLY the suggested filename.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        
        // Clean up the response to ensure it's a valid filename
        const suggestedName = response.text.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
        
        return suggestedName || `AI-Photoshoot-${Date.now()}`;

    } catch (error) {
        console.error("Error suggesting export name:", error);
        // Return a fallback name
        return `AI-Photoshoot-Export-${Date.now()}`;
    }
};