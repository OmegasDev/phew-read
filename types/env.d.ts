declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_OPENROUTER_API_KEY?: string;
      EXPO_PUBLIC_ELEVENLABS_API_KEY?: string;
    }
  }
}

export {};