export const getWebsocketUrl = () => {
    const apiKey = localStorage.getItem('apiKey');
    return `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
};

// REMOVE or comment out getDeepgramApiKey if no longer needed for user speech
// export const getDeepgramApiKey = () => {
//     return localStorage.getItem('deepgramApiKey') || '';
// };

// Audio Configurations
// Note: MODEL_SAMPLE_RATE might be irrelevant now for Gemini's output,
// but keep it if needed elsewhere, or align with ELEVENLABS_OUTPUT_SAMPLERATE
export const MODEL_SAMPLE_RATE = parseInt(localStorage.getItem('sampleRate')) || 24000; // Changed default to match EL

const thresholds = {
    0: "BLOCK_NONE",
    1: "BLOCK_ONLY_HIGH",
    2: "BLOCK_MEDIUM_AND_ABOVE",
    3: "BLOCK_LOW_AND_ABOVE"
}

export const getConfig = () => ({
    model: 'models/gemini-2.0-flash-live-001',
    generationConfig: {
        temperature: parseFloat(localStorage.getItem('temperature')) || 1.8,
        top_p: parseFloat(localStorage.getItem('top_p')) || 0.95,
        top_k: parseInt(localStorage.getItem('top_k')) || 65,
        responseMimeType: "text/plain",
        responseModalities: ["TEXT"]
    },
    systemInstruction: {
        parts: [{
            text: localStorage.getItem('systemInstructions') || "You are a helpful assistant"
        }]
    },
    tools: {
        functionDeclarations: [],
    },
    safetySettings: [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": thresholds[localStorage.getItem('harassmentThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": thresholds[localStorage.getItem('dangerousContentThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": thresholds[localStorage.getItem('sexuallyExplicitThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": thresholds[localStorage.getItem('hateSpeechThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        },
        {
            "category": "HARM_CATEGORY_CIVIC_INTEGRITY",
            "threshold": thresholds[localStorage.getItem('civicIntegrityThreshold')] || "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
        }
    ]
});

export const getElevenLabsApiKey = () => {
    const apiKey = localStorage.getItem('elevenLabsApiKey') || '';
    console.debug('[Config] ElevenLabs API Key fetched:', apiKey ? `Exists (length: ${apiKey.length})` : 'Not Found');
    return apiKey;
};

export const ELEVENLABS_VOICE_ID = 'qwaVDEGNsBllYcZO1ZOJ';
export const ELEVENLABS_MODEL_ID = 'eleven_turbo_v2_5';
export const ELEVENLABS_OUTPUT_SAMPLERATE = 24000;
