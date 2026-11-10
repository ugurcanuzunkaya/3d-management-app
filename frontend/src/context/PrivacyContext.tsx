import { createContext, useContext, useState, useEffect } from 'react';
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

export interface PrivacyContextType {
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

export const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const usePrivacyController = (): PrivacyContextType => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const currentPath = location.pathname;

  const [showPersonalInfo, setShowPersonalInfo] = useState<boolean>(() => {
    const saved = localStorage.getItem('showPersonalInfo');
    return saved ? JSON.parse(saved) : false;
  });

  const [pagePrivacySettings, setPagePrivacySettings] = useState<Record<string, Record<string, boolean>>>(() => {
    const saved = localStorage.getItem('pagePrivacySettings');
    return saved ? JSON.parse(saved) : {};
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('showPersonalInfo', JSON.stringify(showPersonalInfo));
  }, [showPersonalInfo]);

  useEffect(() => {
    localStorage.setItem('pagePrivacySettings', JSON.stringify(pagePrivacySettings));
  }, [pagePrivacySettings]);

  const activePageSettings = pagePrivacySettings[currentPath] || {};

  const { data: presets = [] } = useQuery<PrivacyPreset[]>({
    queryKey: ['privacy-presets', currentPath],
    queryFn: () =>
      api.get('/api/privacy-presets', { params: { page_path: currentPath } }).then((res) => res.data),
    enabled: isEditMode,
  });

  const savePresetMutation = useMutation({
    mutationFn: (newPreset: { name: string; page_path: string; settings: Record<string, boolean> }) =>
      api.post('/api/privacy-presets', newPreset).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['privacy-presets', currentPath] }),
  });

  const deletePresetMutation = useMutation({
    mutationFn: (presetId: number) =>
      api.delete(`/api/privacy-presets/${presetId}`).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['privacy-presets', currentPath] }),
  });

  return {
    showPersonalInfo,
    togglePersonalInfo: () => setShowPersonalInfo((prev) => !prev),
    isEditMode,
    toggleEditMode: () => setIsEditMode((prev) => !prev),
    privacySettings: activePageSettings,
    toggleKeyMask: (key: string) => {
      setPagePrivacySettings((prev) => {
        const pageSettings = prev[currentPath] || {};
        return { ...prev, [currentPath]: { ...pageSettings, [key]: !pageSettings[key] } };
      });
    },
    isMasked: (key: string) => (showPersonalInfo ? false : !!activePageSettings[key]),
    presets,
    savePreset: async (name: string) => {
      await savePresetMutation.mutateAsync({ name, page_path: currentPath, settings: activePageSettings });
    },
    loadPreset: (preset: PrivacyPreset) => {
      setPagePrivacySettings((prev) => ({ ...prev, [currentPath]: preset.settings }));
    },
    deletePreset: async (presetId: number) => {
      await deletePresetMutation.mutateAsync(presetId);
    },
  };
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};
