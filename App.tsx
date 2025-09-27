import React, { useState, useMemo, useEffect } from 'react';
import type { ColorGroup, Presets, GeneratedResult } from './types';
import { ImageUploader } from './components/ImageUploader';
import { PresetSelector } from './components/PresetSelector';
import { ResultViewer } from './components/ResultViewer';
import { INITIAL_PRESETS } from './constants';
import { generateStyledImage, suggestExportName } from './services/geminiService';
import { Icon } from './components/Icon';
import { FullscreenViewer } from './components/FullscreenViewer';
import { ExportModal } from './components/ExportModal';
import { ThemeToggle } from './components/ThemeToggle';

declare var JSZip: any;

function usePersistentState<T>(storageKey: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${storageKey}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key “${storageKey}”:`, error);
    }
  }, [storageKey, value]);

  return [value, setValue];
}


function App() {
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [presets, setPresets] = useState<Presets>(INITIAL_PRESETS);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [templates, setTemplates] = usePersistentState<Record<string, Presets>>('photoshootTemplates', {});
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [poseSelectionMode, setPoseSelectionMode] = useState<'manual' | 'automatic'>('manual');
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [isSuggestingName, setIsSuggestingName] = useState(false);

  const [customHairstyles, setCustomHairstyles] = usePersistentState<string[]>('customHairstyles', []);
  const [customPoses, setCustomPoses] = usePersistentState<string[]>('customPoses', []);
  const [customStyleOptions, setCustomStyleOptions] = usePersistentState<Record<string, string[]>>('customStyleOptions', {});

  const activeGroup = useMemo(() => {
    return colorGroups.find(group => group.id === activeGroupId);
  }, [colorGroups, activeGroupId]);
  
  const generatedImageUrls = useMemo(() => {
    const urls: string[] = [];
    // Ensure consistent order for gallery navigation
    const sortedGroups = [...colorGroups].sort((a, b) => a.name.localeCompare(b.name));
    sortedGroups.forEach(group => {
        group.images.forEach(image => {
            const result = results.find(r => r.sourceImageId === image.id);
            if (result) {
                urls.push(result.generatedImageUrl);
            }
        });
    });
    return urls;
  }, [colorGroups, results]);

  const handleSaveTemplate = (name: string) => {
    if (name.trim()) {
      setTemplates(prev => ({ ...prev, [name.trim()]: presets }));
    }
  };

  const handleApplyTemplate = (name: string) => {
    if (templates[name]) {
      setPresets(templates[name]);
    }
  };

  const handleGroupPoseChange = (groupId: string, newPose: string) => {
    setColorGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, pose: newPose } : group
    ));
  };

  const handleGenerate = async (targetGroupId: string | null) => {
    const groupToGenerate = colorGroups.find(g => g.id === targetGroupId);
    if (!groupToGenerate || groupToGenerate.images.length === 0) {
      setError("Please select a color group with images to generate.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const imageToProcess = groupToGenerate.images[0];
    setProgressMessage(`Generating for "${groupToGenerate.name}"...`);
    
    const groupImageIds = new Set(groupToGenerate.images.map(img => img.id));
    
    const effectivePresets: Presets = {
        ...presets,
        model: {
            ...presets.model,
            pose: groupToGenerate.pose,
        }
    };

    try {
        const { imageUrl, prompt } = await generateStyledImage(imageToProcess.dataUrl, imageToProcess.file.type, effectivePresets, poseSelectionMode);
        const newResult = {
            sourceImageId: imageToProcess.id,
            generatedImageUrl: imageUrl,
            prompt: prompt
        };
        setResults(prev => [...prev.filter(r => !groupImageIds.has(r.sourceImageId)), newResult]);

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
        setIsLoading(false);
        setProgressMessage('');
    }
  };
  
  const handleGenerateAll = async () => {
    const groupsWithImages = colorGroups.filter(g => g.images.length > 0);
    if (groupsWithImages.length === 0) {
        setError("No images to generate. Please add images to at least one color group.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    let firstGeneratedImage: { dataUrl: string; mimeType: string; } | null = null;

    try {
        for (const [groupIndex, group] of groupsWithImages.entries()) {
             const imageToProcess = group.images[0];
             setProgressMessage(`Generating for "${group.name}" (${groupIndex + 1}/${groupsWithImages.length})...`);
             
             const effectivePresets: Presets = {
                ...presets,
                model: {
                    ...presets.model,
                    pose: group.pose,
                }
             };
             
             const { imageUrl, prompt } = await generateStyledImage(
                imageToProcess.dataUrl, 
                imageToProcess.file.type, 
                effectivePresets,
                poseSelectionMode,
                firstGeneratedImage
             );
             
             if (!firstGeneratedImage) {
                const mimeTypeMatch = imageUrl.match(/data:(.*);base64,/);
                const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
                firstGeneratedImage = { dataUrl: imageUrl, mimeType: mimeType };
             }

             const newResult = {
                 sourceImageId: imageToProcess.id,
                 generatedImageUrl: imageUrl,
                 prompt: prompt,
             };
             setResults(prev => [...prev, newResult]);
        }
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unknown error occurred during batch generation.");
        }
    } finally {
        setIsLoading(false);
        setProgressMessage('');
    }
};

 const handleInitiateExport = async () => {
      if (results.length === 0) {
          setError("No generated images to export.");
          return;
      }
      setIsExportModalOpen(true);
      setIsSuggestingName(true);
      
      const context = `Photoshoot for clothing in colors: ${colorGroups.map(g => g.name).join(', ')}. Style: ${presets.style.category} - ${presets.style.option}. Object: ${presets.object}.`;
      try {
          const name = await suggestExportName(context);
          setExportFilename(name);
      } catch (e) {
          console.error(e);
          setExportFilename(`AI-Photoshoot-Export-${Date.now()}`);
      } finally {
          setIsSuggestingName(false);
      }
  };

 const handleBatchExport = async (filename: string) => {
    if (results.length === 0) {
        setError("No generated images to export.");
        return;
    }

    const zip = new JSZip();
    let imageAdded = false;

    const imagePromises = results.map(result => {
        const sourceGroup = colorGroups.find(group => 
            group.images.some(image => image.id === result.sourceImageId)
        );

        if (sourceGroup) {
            return fetch(result.generatedImageUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch image for ${sourceGroup.name}`);
                    return response.blob();
                })
                .then(blob => {
                    const extension = blob.type.split('/')[1] || 'png';
                    const fileName = `${sourceGroup.name.replace(/\s/g, '_')}.${extension}`;
                    zip.file(fileName, blob);
                    imageAdded = true;
                })
                .catch(e => {
                    console.error(`Could not process image for group: ${sourceGroup.name}`, e);
                });
        }
        return Promise.resolve();
    });
    
    await Promise.all(imagePromises);

    if (!imageAdded) {
        setError("Failed to process any images for the ZIP file.");
        return;
    }

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${filename}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        console.error("Error creating zip file:", e);
        setError("Failed to create the ZIP file for export.");
    }

    setIsExportModalOpen(false);
};

const handleImageClick = (url: string) => {
    const index = generatedImageUrls.findIndex(imgUrl => imgUrl === url);
    if (index !== -1) {
        setFullscreenImageIndex(index);
    }
};

  return (
    <div className="min-h-screen w-full flex flex-col p-8 font-sans">
      <header className="flex-shrink-0 mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="text-teal-500 dark:text-teal-400">AI</span> Clothing Photoshoot
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Generate professional product photos with the power of Gemini.</p>
        </div>
        <ThemeToggle />
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col">
          <ImageUploader 
            colorGroups={colorGroups}
            setColorGroups={setColorGroups}
            activeGroupId={activeGroupId}
            setActiveGroupId={setActiveGroupId}
            defaultPose={presets.model.pose}
            onGroupPoseChange={handleGroupPoseChange}
            poseSelectionMode={poseSelectionMode}
            customPoses={customPoses}
          />
        </div>

        <div className="flex flex-col">
            <PresetSelector 
                presets={presets}
                setPresets={setPresets}
                templates={templates}
                onSaveTemplate={handleSaveTemplate}
                onApplyTemplate={handleApplyTemplate}
                poseSelectionMode={poseSelectionMode}
                setPoseSelectionMode={setPoseSelectionMode}
                customHairstyles={customHairstyles}
                setCustomHairstyles={setCustomHairstyles}
                customPoses={customPoses}
                setCustomPoses={setCustomPoses}
                customStyleOptions={customStyleOptions}
                setCustomStyleOptions={setCustomStyleOptions}
            />
        </div>

        <div className="flex flex-col">
            <ResultViewer 
                isLoading={isLoading}
                colorGroups={colorGroups}
                activeGroupId={activeGroupId}
                results={results}
                error={error}
                progressMessage={progressMessage}
                onBatchExport={handleInitiateExport}
                onImageClick={handleImageClick}
                onActiveGroupChange={setActiveGroupId}
            />
            <div className="flex-shrink-0 pt-4">
               <div className="relative flex rounded-lg shadow-lg">
                <button
                  onClick={() => handleGenerate(activeGroupId)}
                  disabled={isLoading || !activeGroup || activeGroup.images.length === 0}
                  className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-l-lg transition-all text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="wand" className="w-6 h-6" />
                      <span>{activeGroup ? `Generate for "${activeGroup.name}"` : 'Generate Photoshoot'}</span>
                    </>
                  )}
                </button>
                <div className="flex-shrink-0">
                    <button
                        onClick={() => setIsDropdownOpen(prev => !prev)}
                        disabled={isLoading}
                        className="h-full px-3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-r-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500"
                    >
                        <Icon name="chevron-down" className="w-5 h-5" />
                    </button>
                </div>
                {isDropdownOpen && (
                    <div 
                        className="origin-top-right absolute right-0 bottom-full mb-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                        role="menu"
                        aria-orientation="vertical"
                    >
                      <div className="py-1" role="none">
                        <button
                          onClick={() => {
                            handleGenerateAll();
                            setIsDropdownOpen(false);
                          }}
                          disabled={isLoading || colorGroups.filter(g => g.images.length > 0).length === 0}
                          className="w-full text-left text-slate-700 dark:text-slate-200 block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
                          role="menuitem"
                        >
                          Generate for All Colors
                        </button>
                      </div>
                    </div>
                )}
              </div>
            </div>
        </div>
      </main>

      {fullscreenImageIndex !== null && generatedImageUrls.length > 0 && (
          <FullscreenViewer
              images={generatedImageUrls}
              currentIndex={fullscreenImageIndex}
              onClose={() => setFullscreenImageIndex(null)}
              onNavigate={setFullscreenImageIndex}
          />
      )}
      
      <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleBatchExport}
          initialName={exportFilename}
          isLoadingName={isSuggestingName}
      />
    </div>
  );
}

export default App;