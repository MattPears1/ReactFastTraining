import { useState, useCallback, useEffect } from "react";
import { AllSettings } from "../types";
import { DEFAULT_SETTINGS } from "../constants";

export const useSettings = () => {
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [originalSettings, setOriginalSettings] = useState<AllSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    // In real app, load from API
    const loadedSettings = { ...DEFAULT_SETTINGS };
    setSettings(loadedSettings);
    setOriginalSettings(loadedSettings);
  }, []);

  const updateSettings = useCallback((section: keyof AllSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalSettings(settings);
      setHasChanges(false);
      setSavedMessage("Settings saved successfully");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const resetChanges = useCallback(() => {
    setSettings(originalSettings);
    setHasChanges(false);
  }, [originalSettings]);

  return {
    settings,
    hasChanges,
    saving,
    savedMessage,
    updateSettings,
    handleSave,
    resetChanges,
  };
};