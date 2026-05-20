import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface PrivacyPreset {
  id: number;
  name: string;
  page_path: string;
  settings: Record<string, boolean>;
  created_at: string;
}

interface PrivacyContextType {
  showPersonalInfo: boolean;
  togglePersonalInfo: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  privacySettings: Record<string, boolean>;
  toggleKeyMask: (key: string) => void;
  isMasked: (key: string) => boolean;
  presets: PrivacyPreset[];
  savePreset: (name: string) => Promise<void>;
  loadPreset: (preset: PrivacyPreset) => void;
  deletePreset: (presetId: number) => Promise<void>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentPath = location.pathname;

  // Global show/hide info visibility
  const [showPersonalInfo, setShowPersonalInfo] = useState<boolean>(() => {
    const saved = localStorage.getItem('showPersonalInfo');
    return saved ? JSON.parse(saved) : false;
  });

  // Page-based privacy settings
  // localStorage stores pagePrivacySettings: Record<string, Record<string, boolean>>
  const [pagePrivacySettings, setPagePrivacySettings] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('pagePrivacySettings');
    return saved ? JSON.parse(saved) : {};
  });

  // Edit mode to select elements to hide
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('showPersonalInfo', JSON.stringify(showPersonalInfo));
  }, [showPersonalInfo]);

  useEffect(() => {
    localStorage.setItem('pagePrivacySettings', JSON.stringify(pagePrivacySettings));
  }, [pagePrivacySettings]);

  // Handle cross-tab/window updates using event listener
  useEffect(() => {
    const handleUpdate = () => {
      const savedShow = localStorage.getItem('showPersonalInfo');
      setShowPersonalInfo(savedShow ? JSON.parse(savedShow) : false);

      const savedPageSettings = localStorage.getItem('pagePrivacySettings');
      setPagePrivacySettings(savedPageSettings ? JSON.parse(savedPageSettings) : {});
    };
    window.addEventListener('privacy-settings-change', handleUpdate);
    // Backward compatibility with the old event name
    window.addEventListener('credentials-visibility-change', handleUpdate);
    return () => {
      window.removeEventListener('privacy-settings-change', handleUpdate);
      window.removeEventListener('credentials-visibility-change', handleUpdate);
    };
  }, []);

  const dispatchUpdateEvent = () => {
    window.dispatchEvent(new Event('privacy-settings-change'));
    window.dispatchEvent(new Event('credentials-visibility-change'));
  };

  const togglePersonalInfo = () => {
    setShowPersonalInfo((prev) => {
      const next = !prev;
      localStorage.setItem('showPersonalInfo', JSON.stringify(next));
      dispatchUpdateEvent();
      return next;
    });
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => !prev);
  };

  // Get active settings for the current page
  const activePageSettings = pagePrivacySettings[currentPath] || {};

  const toggleKeyMask = (key: string) => {
    setPagePrivacySettings((prev) => {
      const pageSettings = prev[currentPath] || {};
      const next = {
        ...prev,
        [currentPath]: {
          ...pageSettings,
          [key]: !pageSettings[key],
        },
      };
      localStorage.setItem('pagePrivacySettings', JSON.stringify(next));
      dispatchUpdateEvent();
      return next;
    });
  };

  const isMasked = (key: string) => {
    if (showPersonalInfo) return false;
    return !!activePageSettings[key];
  };

  // Database Presets
  const { data: presets = [] } = useQuery<PrivacyPreset[]>({
    queryKey: ['privacy-presets', currentPath],
    queryFn: () =>
      api
        .get(`/api/privacy-presets`, { params: { page_path: currentPath } })
        .then((res) => res.data),
  });

  const savePresetMutation = useMutation({
    mutationFn: (newPreset: { name: string; page_path: string; settings: Record<string, boolean> }) =>
      api.post('/api/privacy-presets', newPreset).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-presets', currentPath] });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (presetId: number) =>
      api.delete(`/api/privacy-presets/${presetId}`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-presets', currentPath] });
    },
  });

  const savePreset = async (name: string) => {
    await savePresetMutation.mutateAsync({
      name,
      page_path: currentPath,
      settings: activePageSettings,
    });
  };

  const loadPreset = (preset: PrivacyPreset) => {
    setPagePrivacySettings((prev) => {
      const next = {
        ...prev,
        [currentPath]: preset.settings,
      };
      localStorage.setItem('pagePrivacySettings', JSON.stringify(next));
      dispatchUpdateEvent();
      return next;
    });
  };

  const deletePreset = async (presetId: number) => {
    await deletePresetMutation.mutateAsync(presetId);
  };

  return (
    <PrivacyContext.Provider
      value={{
        showPersonalInfo,
        togglePersonalInfo,
        isEditMode,
        toggleEditMode,
        privacySettings: activePageSettings,
        toggleKeyMask,
        isMasked,
        presets,
        savePreset,
        loadPreset,
        deletePreset,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
