import { useEffect, useState } from 'react';

export interface VoiceModel {
  id: string;
  label: string;
  provider: string;
  description?: string;
  capabilities?: Record<string, any>;
}

export function useVoiceModels() {
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${base}/api/public/voice-models/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setModels(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load voice models');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return { models, isLoading, error };
}
