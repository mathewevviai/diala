import { useState, useEffect } from 'react';
import { EmbeddingModel } from '@/components/onboarding/bulk/types';

interface UseEmbeddingModelsReturn {
  models: EmbeddingModel[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useEmbeddingModels(): UseEmbeddingModelsReturn {
  const [models, setModels] = useState<EmbeddingModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      console.log('API URL:', apiUrl);
      const fullUrl = `${apiUrl}/api/public/embedding-models/`;
      console.log('Full URL:', fullUrl);
      
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch embedding models: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to match EmbeddingModel interface
      const transformedModels: EmbeddingModel[] = data.map((model: any) => ({
        id: model.id,
        label: model.label,
        Icon: null, // Will be set in the component
        color: model.color,
        tooltip: model.description,
        dimensions: model.dimensions,
        maxTokens: model.maxTokens,
        description: model.description,
        githubStars: model.githubStars,
        parameters: model.parameters,
        mtebScore: model.mtebScore
      }));
      
      setModels(transformedModels);
    } catch (err) {
      console.error('Error fetching embedding models:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Fallback to static data if API fails
      setModels([
        {
          id: 'jina-embeddings-v4',
          label: 'JINA EMBEDDER V4',
          Icon: null,
          color: 'bg-purple-600',
          tooltip: 'Latest Jina AI multimodal embedding model with 3.8B parameters',
          dimensions: 1024,
          maxTokens: 8192,
          description: 'State-of-the-art multimodal embedding model with 3.8B parameters. Supports 100+ languages, text, images, and code with superior MTEB performance (64.41 avg score).',
          githubStars: 2847,
          parameters: '3.8B',
          mtebScore: 64.41
        },
        {
          id: 'gemini-embedding-exp',
          label: 'GEMINI EMBEDDING EXP',
          Icon: null,
          color: 'bg-blue-600',
          tooltip: 'State-of-the-art experimental embedding model with SOTA MTEB performance',
          dimensions: 3072,
          maxTokens: 8192,
          description: 'State-of-the-art experimental embedding model with SOTA MTEB performance. Features 8K context, MRL support, and 100+ languages.',
          githubStars: null,
          parameters: 'Gemini-trained',
          mtebScore: 68.32
        },
        {
          id: 'openai-ada-002',
          label: 'OPENAI ADA-002',
          Icon: null,
          color: 'bg-green-600',
          tooltip: 'OpenAI\'s text-embedding-ada-002 model',
          dimensions: 1536,
          maxTokens: 8191,
          description: 'Reliable and widely-used embedding model from OpenAI. Great for general-purpose semantic search and content similarity tasks.',
          githubStars: null,
          parameters: 'Undisclosed',
          mtebScore: 60.9
        },
        {
          id: 'custom-model',
          label: 'CUSTOM MODEL',
          Icon: null,
          color: 'bg-gray-600',
          tooltip: 'Use your own embedding model or API endpoint',
          dimensions: 0,
          maxTokens: 0,
          description: 'Configure your own embedding model endpoint. Supports any model that follows the standard embedding API format.',
          githubStars: null,
          parameters: 'Variable',
          mtebScore: null
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    isLoading,
    error,
    refetch: fetchModels
  };
}