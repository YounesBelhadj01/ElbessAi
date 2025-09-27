import React, { useMemo } from 'react';
import type { ColorGroup, ImageFile } from '../types';
import { Icon } from './Icon';
import { POSE_LIBRARY } from '../constants';

interface ImageUploaderProps {
  colorGroups: ColorGroup[];
  setColorGroups: React.Dispatch<React.SetStateAction<ColorGroup[]>>;
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  defaultPose: string;
  onGroupPoseChange: (id: string, newPose: string) => void;
  poseSelectionMode: 'manual' | 'automatic';
  customPoses: string[];
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ colorGroups, setColorGroups, activeGroupId, setActiveGroupId, defaultPose, onGroupPoseChange, poseSelectionMode, customPoses }) => {

  const dynamicPoseLibrary = useMemo(() => {
    if (customPoses.length === 0) {
      return POSE_LIBRARY;
    }
    return {
      ...POSE_LIBRARY,
      'Custom': customPoses,
    };
  }, [customPoses]);

  const handleAddGroup = () => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: ColorGroup = {
      id: newGroupId,
      name: `Color ${colorGroups.length + 1}`,
      images: [],
      pose: defaultPose, // Set the default pose for the new group
    };
    setColorGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroupId);
  };

  const handleDeleteGroup = (id: string) => {
    setColorGroups(prev => prev.filter(group => group.id !== id));
    if (activeGroupId === id) {
      setActiveGroupId(colorGroups.length > 1 ? colorGroups[0].id : null);
    }
  };

  const handleNameChange = (id: string, newName: string) => {
    setColorGroups(prev => prev.map(group => group.id === id ? { ...group, name: newName } : group));
  };
  
  const handleImageUpload = async (groupId: string, files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await fileToBase64(file);
      newImages.push({ id: `img-${Date.now()}-${Math.random()}`, file, dataUrl });
    }

    setColorGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const updatedImages = [...group.images, ...newImages].slice(0, 4); // Limit to 4 images
        return { ...group, images: updatedImages };
      }
      return group;
    }));
  };

  const handleDeleteImage = (groupId: string, imageId: string) => {
    setColorGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return { ...group, images: group.images.filter(img => img.id !== imageId) };
      }
      return group;
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow-lg rounded-lg p-4 flex flex-col h-full border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Upload Images</h2>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {colorGroups.map(group => (
          <div key={group.id} className={`p-4 rounded-lg transition-all ${activeGroupId === group.id ? 'bg-slate-100 dark:bg-slate-800/80 ring-2 ring-teal-500' : 'bg-slate-50 dark:bg-slate-800/40'}`}>
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={group.name}
                onChange={(e) => handleNameChange(group.id, e.target.value)}
                onFocus={() => setActiveGroupId(group.id)}
                className="bg-transparent text-lg font-semibold text-slate-800 dark:text-white border-none focus:ring-0 p-0 w-full"
              />
              <button onClick={() => handleDeleteGroup(group.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                <Icon name="trash" className="w-5 h-5" />
              </button>
            </div>
            
            {poseSelectionMode === 'manual' && (
              <div className="mb-3">
                <label htmlFor={`pose-${group.id}`} className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Pose</label>
                <select
                  id={`pose-${group.id}`}
                  value={group.pose}
                  onChange={(e) => onGroupPoseChange(group.id, e.target.value)}
                  onFocus={() => setActiveGroupId(group.id)}
                  className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-sm rounded-md border-slate-300 dark:border-slate-600 focus:ring-teal-500 focus:border-teal-500"
                >
                  {Object.entries(dynamicPoseLibrary).map(([category, poses]) => (
                    <optgroup key={category} label={category}>
                      {/* FIX: Cast `poses` to `string[]` as Object.entries may infer its type as `unknown`. */}
                      {(poses as string[]).map(pose => (
                        <option key={pose} value={pose}>{pose}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              {group.images.map(image => (
                <div key={image.id} className="relative group aspect-square">
                  <img src={image.dataUrl} alt="upload preview" className="w-full h-full object-cover rounded-md" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleDeleteImage(group.id, image.id)} className="text-white hover:text-red-400">
                      <Icon name="trash" className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
              {group.images.length < 4 && (
                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors aspect-square">
                  <Icon name="upload" className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm text-slate-500 mt-1">Upload</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(group.id, e.target.files)} />
                </label>
              )}
            </div>
          </div>
        ))}
        {colorGroups.length === 0 && (
          <div className="text-center text-slate-500 pt-16">
            <Icon name="palette" className="w-16 h-16 mx-auto mb-4" />
            <p>Add a color group to start</p>
            <p className="text-sm">Upload up to 4 images per color.</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex-shrink-0">
        <button onClick={handleAddGroup} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
          <Icon name="plus" className="w-5 h-5" />
          Add Color
        </button>
      </div>
    </div>
  );
};