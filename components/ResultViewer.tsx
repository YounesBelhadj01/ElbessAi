
import React, { useState, useMemo } from 'react';
import type { ColorGroup, GeneratedResult } from '../types';
import { Icon } from './Icon';

interface ResultViewerProps {
  isLoading: boolean;
  colorGroups: ColorGroup[];
  activeGroupId: string | null;
  results: GeneratedResult[];
  error: string | null;
  progressMessage: string;
  onBatchExport: () => void;
  onImageClick: (url: string) => void;
  onActiveGroupChange: (groupId: string | null) => void;
}

const LoadingState: React.FC<{ progressMessage: string }> = ({ progressMessage }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
    <div className="relative mb-4">
      <div className="w-24 h-24 border-4 border-t-teal-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin"></div>
      <Icon name="wand" className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-500 dark:text-teal-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Generating your photoshoot...</h3>
    <p className="mt-2 max-w-sm text-sm">
      {progressMessage || 'Our AI is setting up the lights, choosing the perfect model, and styling your product. This can take a moment.'}
    </p>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
    <Icon name="image" className="w-20 h-20 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Your results will appear here</h3>
    <p className="mt-1 max-w-sm text-sm">Upload images, configure your presets, and click "Generate" to see the magic happen.</p>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
         <Icon name="info" className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-500 dark:text-red-400">An Error Occurred</h3>
        <p className="mt-2 max-w-md text-sm bg-red-500/10 dark:bg-red-900/30 p-3 rounded-md border border-red-500/20">{error}</p>
    </div>
);

const ResultDisplay: React.FC<{ activeGroup: ColorGroup; results: GeneratedResult[]; onImageClick: (url: string) => void; }> = ({ activeGroup, results, onImageClick }) => {
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getResultForImage = (imageId: string) => results.find(r => r.sourceImageId === imageId);
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeGroup.images.map(image => {
          const result = getResultForImage(image.id);
          return (
            <div key={image.id} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="aspect-square relative">
                  <img src={image.dataUrl} alt="Original" className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Original</div>
                </div>
                <div className="aspect-square bg-slate-200 dark:bg-slate-800 relative group">
                  {result ? (
                    <>
                      <img 
                        src={result.generatedImageUrl} 
                        alt="Generated" 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => onImageClick(result.generatedImageUrl)}
                      />
                      <div className="absolute top-2 left-2 bg-teal-600/80 text-white text-xs px-2 py-1 rounded">AI Generated</div>
                       <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                           <button onClick={(e) => { e.stopPropagation(); downloadImage(result.generatedImageUrl, `${activeGroup.name}_${image.file.name}_AI.png`)}} className="p-1.5 rounded-full bg-slate-600 hover:bg-teal-600 text-white transition-colors">
                               <Icon name="download" className="w-4 h-4" />
                           </button>
                           <button
                              onMouseEnter={() => setHoveredPrompt(result.prompt)}
                              onMouseLeave={() => setHoveredPrompt(null)}
                              className="p-1.5 rounded-full bg-slate-600 hover:bg-teal-600 text-white transition-colors relative"
                           >
                               <Icon name="info" className="w-4 h-4" />
                           </button>
                       </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">Awaiting...</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
       {hoveredPrompt && (
        <div className="fixed bottom-4 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-lg max-w-md text-xs text-slate-700 dark:text-slate-300 z-50">
          <p className="font-mono">{hoveredPrompt}</p>
        </div>
      )}
    </>
  );
};

export const ResultViewer: React.FC<ResultViewerProps> = ({ isLoading, colorGroups, activeGroupId, results, error, progressMessage, onBatchExport, onImageClick, onActiveGroupChange }) => {

  const groupsWithResults = useMemo(() => {
    const groupIdsWithResults = new Set<string>();
    results.forEach(result => {
      const group = colorGroups.find(g => g.images.some(i => i.id === result.sourceImageId));
      if (group) {
        groupIdsWithResults.add(group.id);
      }
    });
    return colorGroups.filter(g => groupIdsWithResults.has(g.id));
  }, [colorGroups, results]);

  const currentIndex = useMemo(() => {
    if (!activeGroupId || groupsWithResults.length === 0) return 0;
    const index = groupsWithResults.findIndex(g => g.id === activeGroupId);
    return index === -1 ? 0 : index;
  }, [activeGroupId, groupsWithResults]);

  const handlePrev = () => {
    if (groupsWithResults.length < 2) return;
    const newIndex = currentIndex === 0 ? groupsWithResults.length - 1 : currentIndex - 1;
    onActiveGroupChange(groupsWithResults[newIndex].id);
  };

  const handleNext = () => {
    if (groupsWithResults.length < 2) return;
    const newIndex = currentIndex === groupsWithResults.length - 1 ? 0 : currentIndex + 1;
    onActiveGroupChange(groupsWithResults[newIndex].id);
  };

  const hasResults = groupsWithResults.length > 0;
  const activeGroupForDisplay = hasResults ? groupsWithResults[currentIndex] : undefined;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-lg rounded-lg p-6 flex flex-col border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Preview & Export</h2>
        {results.length > 0 && !isLoading && (
             <button 
                onClick={onBatchExport}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
             >
                <Icon name="download" className="w-4 h-4" />
                Batch Export
            </button>
        )}
      </div>
      <div className="flex-grow bg-slate-50 dark:bg-slate-800/50 rounded-lg relative overflow-hidden flex flex-col">
        {isLoading ? <div className="p-4 flex-grow flex items-center justify-center"><LoadingState progressMessage={progressMessage} /></div> :
         error ? <div className="p-4 flex-grow flex items-center justify-center"><ErrorState error={error} /></div> :
         hasResults && activeGroupForDisplay ? (
            <>
              <div className="p-4 pb-2 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4" title={activeGroupForDisplay.name}>{activeGroupForDisplay.name}</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">{currentIndex + 1} / {groupsWithResults.length}</span>
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4 pt-2">
                 <ResultDisplay activeGroup={activeGroupForDisplay} results={results} onImageClick={onImageClick} />
              </div>

              {groupsWithResults.length > 1 && (
                <>
                  <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800 text-slate-800 dark:text-white p-2 rounded-full z-10 transition-all transform active:scale-90 shadow-md" aria-label="Previous slide">
                    <Icon name="chevron-left" className="w-6 h-6" />
                  </button>
                  <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800 text-slate-800 dark:text-white p-2 rounded-full z-10 transition-all transform active:scale-90 shadow-md" aria-label="Next slide">
                    <Icon name="chevron-right" className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {groupsWithResults.map((group, index) => (
                      <button 
                        key={group.id}
                        onClick={() => onActiveGroupChange(group.id)}
                        className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-teal-500' : 'bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-500'}`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
         ) :
         <div className="p-4 flex-grow flex items-center justify-center"><EmptyState /></div>
        }
      </div>
    </div>
  );
};