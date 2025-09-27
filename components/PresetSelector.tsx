import React, { useState, useEffect, useMemo } from 'react';
import type { Presets } from '../types';
import { 
  OBJECT_OPTIONS, STYLE_OPTIONS, MODEL_GENDERS, MODEL_SKIN_TONES, 
  MODEL_HAIR_COLORS, POSE_LIBRARY, POSE_CATEGORIES, MANNEQUIN_MATERIALS, MANNEQUIN_HAIR, 
  MANNEQUIN_GENDERS, HANGER_TYPES, HAIRSTYLE_LIBRARY
} from '../constants';
import { Icon } from './Icon';
import { generateModelFaces } from '../services/geminiService';


interface PresetSelectorProps {
  presets: Presets;
  setPresets: React.Dispatch<React.SetStateAction<Presets>>;
  templates: Record<string, Presets>;
  onSaveTemplate: (name: string) => void;
  onApplyTemplate: (name: string) => void;
  poseSelectionMode: 'manual' | 'automatic';
  setPoseSelectionMode: (mode: 'manual' | 'automatic') => void;
  customHairstyles: string[];
  setCustomHairstyles: React.Dispatch<React.SetStateAction<string[]>>;
  customPoses: string[];
  setCustomPoses: React.Dispatch<React.SetStateAction<string[]>>;
  customStyleOptions: Record<string, string[]>;
  setCustomStyleOptions: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const CustomItemAdder: React.FC<{ onAdd: (item: string) => void, buttonText: string }> = ({ onAdd, buttonText }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [value, setValue] = useState('');

    const handleAdd = () => {
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
            setIsAdding(false);
        }
    };

    if (!isAdding) {
        return (
            <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200"
            >
                <Icon name="plus" className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="flex gap-2 w-full p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`New ${buttonText}...`}
                className="flex-grow bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setIsAdding(false); }}
            />
            <button onClick={handleAdd} className="px-3 py-1.5 bg-teal-600 text-white rounded-md text-sm font-semibold">Add</button>
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 rounded-md text-sm">Cancel</button>
        </div>
    );
};

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
        {children}
    </div>
);

const RadioPill: React.FC<{
    options: string[];
    selectedValue: string;
    onChange: (value: string) => void;
}> = ({ options, selectedValue, onChange }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(option => (
            <button
                key={option}
                onClick={() => onChange(option)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedValue === option ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                }`}
            >
                {option}
            </button>
        ))}
    </div>
);

export const PresetSelector: React.FC<PresetSelectorProps> = ({ 
    presets, setPresets, templates, onSaveTemplate, onApplyTemplate, poseSelectionMode, 
    setPoseSelectionMode, customHairstyles, setCustomHairstyles, customPoses, setCustomPoses,
    customStyleOptions, setCustomStyleOptions
}) => {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isPoseTooltipVisible, setIsPoseTooltipVisible] = useState(false);
  const [generatedFaces, setGeneratedFaces] = useState<string[]>([]);
  const [isGeneratingFaces, setIsGeneratingFaces] = useState<boolean>(false);
  const [faceGenerationError, setFaceGenerationError] = useState<string | null>(null);
  

  const dynamicPoseLibrary = useMemo(() => {
    if (customPoses.length === 0) {
      return POSE_LIBRARY;
    }
    return {
      ...POSE_LIBRARY,
      'Custom': customPoses,
    };
  }, [customPoses]);
  
  const DYNAMIC_POSE_CATEGORIES = useMemo(() => Object.keys(dynamicPoseLibrary), [dynamicPoseLibrary]);
  const [poseCategory, setPoseCategory] = useState<string>(DYNAMIC_POSE_CATEGORIES[0]);

  
  const handlePresetChange = <K extends keyof Omit<Presets, 'object' | 'customInstructions'>, V>(section: K, key: keyof Presets[K], value: V) => {
    setPresets(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };
  
  const availableHairstyles = useMemo(() => {
    const { gender, skinTone } = presets.model;
    const skinToneKey = skinTone as keyof typeof HAIRSTYLE_LIBRARY['Female'];

    const unisexStyles = HAIRSTYLE_LIBRARY['Unisex/Non-binary'][skinToneKey] || [];
    let genderSpecificStyles: string[] = [];

    if (gender === 'Female' || gender === 'Male') {
        genderSpecificStyles = HAIRSTYLE_LIBRARY[gender][skinToneKey] || [];
    } else { // Non-binary
        const femaleStyles = HAIRSTYLE_LIBRARY['Female'][skinToneKey] || [];
        const maleStyles = HAIRSTYLE_LIBRARY['Male'][skinToneKey] || [];
        genderSpecificStyles = [...new Set([...femaleStyles, ...maleStyles])];
    }
    
    const finalStyles = [...new Set([...genderSpecificStyles, ...unisexStyles, ...customHairstyles])];
    return finalStyles;

  }, [presets.model.gender, presets.model.skinTone, customHairstyles]);

  const dynamicStyleOptions = useMemo(() => {
    const category = presets.style.category;
    const customOptionsForCategory = customStyleOptions[category] || [];
    const baseOptions = STYLE_OPTIONS[category as keyof typeof STYLE_OPTIONS] || [];
    return [...new Set([...baseOptions, ...customOptionsForCategory])];
  }, [presets.style.category, customStyleOptions]);


  useEffect(() => {
    const newCategoryPoses = dynamicPoseLibrary[poseCategory as keyof typeof dynamicPoseLibrary];
    if (!newCategoryPoses.includes(presets.model.pose)) {
        handlePresetChange('model', 'pose', newCategoryPoses[0]);
    }
  }, [poseCategory, dynamicPoseLibrary]);
  
  useEffect(() => {
    if (!availableHairstyles.includes(presets.model.hairstyle)) {
        handlePresetChange('model', 'hairstyle', availableHairstyles[0] || '');
    }
  }, [availableHairstyles]);


  const handleObjectChange = (value: string) => {
    setPresets(prev => ({ ...prev, object: value }));
  };
  
  const handleStyleCategoryChange = (value: string) => {
    const newOptions = customStyleOptions[value] || STYLE_OPTIONS[value as keyof typeof STYLE_OPTIONS];
    const newOption = newOptions[0];
    setPresets(prev => ({ ...prev, style: { category: value, option: newOption } }));
  };

  const handleSaveClick = () => {
      if (newTemplateName.trim()) {
          onSaveTemplate(newTemplateName.trim());
          setNewTemplateName('');
      }
  };

  const handleGenerateFaces = async () => {
    setIsGeneratingFaces(true);
    setFaceGenerationError(null);
    setGeneratedFaces([]);
    handlePresetChange('model', 'selectedFaceUrl', null);
    try {
        const faces = await generateModelFaces(
            presets.model.gender,
            presets.model.skinTone,
            presets.model.hair,
            presets.model.age,
            presets.model.hairstyle,
        );
        setGeneratedFaces(faces);
    } catch (e) {
        if (e instanceof Error) {
            setFaceGenerationError(e.message);
        } else {
            setFaceGenerationError("An unknown error occurred while generating faces.");
        }
    } finally {
        setIsGeneratingFaces(false);
    }
  };


  return (
    <div className="bg-white dark:bg-slate-900 shadow-lg rounded-lg p-6 flex flex-col border border-slate-200 dark:border-slate-800">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">2. Configure Photoshoot</h2>
      <div className="flex-grow overflow-y-auto pr-2">

        <Section title="Templates">
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="New template name..."
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md border-slate-300 dark:border-slate-700 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                onClick={handleSaveClick}
                disabled={!newTemplateName.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Save
              </button>
            </div>
            <select
              onChange={(e) => onApplyTemplate(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md border-slate-300 dark:border-slate-700 focus:ring-teal-500 focus:border-teal-500"
              value=""
            >
              <option value="" disabled>Load a template...</option>
              {Object.keys(templates).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </Section>
        
        <Section title="Object">
          <RadioPill options={OBJECT_OPTIONS} selectedValue={presets.object} onChange={handleObjectChange} />
        </Section>

        {presets.object === 'Human model' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6">
            <Section title="Model Presets">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Gender</label>
                        <RadioPill options={MODEL_GENDERS} selectedValue={presets.model.gender} onChange={(v) => handlePresetChange('model', 'gender', v)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Skin Tone</label>
                        <RadioPill options={MODEL_SKIN_TONES} selectedValue={presets.model.skinTone} onChange={(v) => handlePresetChange('model', 'skinTone', v)} />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Hair Color</label>
                        <RadioPill options={MODEL_HAIR_COLORS} selectedValue={presets.model.hair} onChange={(v) => handlePresetChange('model', 'hair', v)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Hairstyle</label>
                         <div className="flex flex-wrap gap-2 items-center">
                            <RadioPill 
                                options={availableHairstyles} 
                                selectedValue={presets.model.hairstyle} 
                                onChange={(v) => handlePresetChange('model', 'hairstyle', v)} 
                            />
                            <CustomItemAdder 
                                onAdd={(item) => setCustomHairstyles(prev => [...new Set([...prev, item])])} 
                                buttonText="Hairstyle"
                            />
                        </div>
                    </div>
                    <div>
                         <label htmlFor="age" className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Age: {presets.model.age}</label>
                         <input id="age" type="range" min="1" max="80" value={presets.model.age} onChange={e => handlePresetChange('model', 'age', parseInt(e.target.value, 10))} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Model Face</label>
                      <div className="space-y-3">
                          <button
                              onClick={handleGenerateFaces}
                              disabled={isGeneratingFaces || presets.model.hair === 'Custom'}
                              className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-md transition-colors"
                          >
                              {isGeneratingFaces ? (
                                  <>
                                      <div className="w-5 h-5 border-2 border-t-transparent border-teal-400 rounded-full animate-spin"></div>
                                      Generating...
                                  </>
                              ) : (
                                  <>
                                      <Icon name="wand" className="w-5 h-5" />
                                      Generate Faces
                                  </>
                              )}
                          </button>
                          {presets.model.hair === 'Custom' && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Face generation is disabled for custom hair colors.</p>
                          )}
                          
                          <div className="grid grid-cols-3 gap-3">
                              {isGeneratingFaces && Array.from({ length: 3 }).map((_, index) => (
                                  <div key={index} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center animate-pulse">
                                      <Icon name="image" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                  </div>
                              ))}

                              {!isGeneratingFaces && generatedFaces.map((faceUrl, index) => (
                                  <button 
                                      key={index} 
                                      onClick={() => handlePresetChange('model', 'selectedFaceUrl', faceUrl)}
                                      className={`aspect-square rounded-md overflow-hidden focus:outline-none ring-offset-2 dark:ring-offset-slate-900 focus:ring-2 focus:ring-teal-500 ${
                                          presets.model.selectedFaceUrl === faceUrl ? 'ring-2 ring-teal-500' : 'ring-1 ring-transparent hover:ring-teal-400'
                                      }`}
                                  >
                                      <img src={faceUrl} alt={`Generated model face ${index + 1}`} className="w-full h-full object-cover" />
                                  </button>
                              ))}
                          </div>

                          {faceGenerationError && (
                              <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-md">{faceGenerationError}</p>
                          )}
                      </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Pose Mode</label>
                        <RadioPill
                          options={['Manual', 'Automatic']}
                          selectedValue={poseSelectionMode === 'manual' ? 'Manual' : 'Automatic'}
                          onChange={(v) => setPoseSelectionMode(v.toLowerCase() as 'manual' | 'automatic')}
                        />
                    </div>
                    {poseSelectionMode === 'manual' && (
                        <div>
                            <div className="relative flex items-center mb-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Pose</label>
                                <div 
                                    className="ml-2"
                                    onMouseEnter={() => setIsPoseTooltipVisible(true)}
                                    onMouseLeave={() => setIsPoseTooltipVisible(false)}
                                >
                                    <Icon name="info" className="w-4 h-4 text-slate-400 cursor-pointer" />
                                </div>
                                {isPoseTooltipVisible && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-md shadow-lg text-xs text-slate-600 dark:text-slate-300 z-10">
                                        This sets the default pose for new color groups. You can set a unique pose for each color in the upload panel.
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <select
                                    value={poseCategory}
                                    onChange={(e) => setPoseCategory(e.target.value)}
                                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded-md border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    {DYNAMIC_POSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <RadioPill 
                                        options={dynamicPoseLibrary[poseCategory as keyof typeof dynamicPoseLibrary]} 
                                        selectedValue={presets.model.pose} 
                                        onChange={(v) => handlePresetChange('model', 'pose', v)} 
                                    />
                                     <CustomItemAdder 
                                        onAdd={(item) => {
                                            if (customPoses.length === 0) setPoseCategory('Custom');
                                            setCustomPoses(prev => [...new Set([...prev, item])]);
                                            handlePresetChange('model', 'pose', item);
                                        }}
                                        buttonText="Pose"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Section>
          </div>
        )}

        {presets.object === 'Mannequin' && (
           <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6">
            <Section title="Mannequin Presets">
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Material</label>
                        <RadioPill options={MANNEQUIN_MATERIALS} selectedValue={presets.mannequin.material} onChange={(v) => handlePresetChange('mannequin', 'material', v)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Gender</label>
                        <RadioPill options={MANNEQUIN_GENDERS} selectedValue={presets.mannequin.gender} onChange={(v) => handlePresetChange('mannequin', 'gender', v)} />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Hair</label>
                        <RadioPill options={MANNEQUIN_HAIR} selectedValue={presets.mannequin.hair} onChange={(v) => handlePresetChange('mannequin', 'hair', v)} />
                    </div>
                </div>
            </Section>
          </div>
        )}

        {presets.object === 'Hanger' && (
           <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6">
            <Section title="Hanger Presets">
                <RadioPill options={HANGER_TYPES} selectedValue={presets.hanger.type} onChange={(v) => handlePresetChange('hanger', 'type', v)} />
            </Section>
          </div>
        )}

        <Section title="Style">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Category</label>
              <RadioPill options={Object.keys(STYLE_OPTIONS)} selectedValue={presets.style.category} onChange={handleStyleCategoryChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Option</label>
               <div className="flex flex-wrap gap-2 items-center">
                  <RadioPill options={dynamicStyleOptions} selectedValue={presets.style.option} onChange={(v) => handlePresetChange('style', 'option', v)} />
                   <CustomItemAdder
                        onAdd={(item) => {
                            const category = presets.style.category;
                            setCustomStyleOptions(prev => ({
                                ...prev,
                                [category]: [...new Set([...(prev[category] || []), item])]
                            }));
                            handlePresetChange('style', 'option', item);
                        }}
                        buttonText="Style Option"
                    />
                </div>
            </div>
          </div>
        </Section>

        <Section title="Custom Instructions">
            <textarea
                value={presets.customInstructions}
                onChange={(e) => setPresets(prev => ({...prev, customInstructions: e.target.value}))}
                rows={3}
                placeholder="e.g., The model should be smiling, add a leather handbag..."
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md border-slate-300 dark:border-slate-700 focus:ring-teal-500 focus:border-teal-500"
            />
        </Section>
      </div>
    </div>
  );
};