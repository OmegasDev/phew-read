import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { SubscriptionService } from './subscriptionService';

export class TTSService {
  private static isSpeaking = false;

  static async speak(text: string, useNaturalVoice: boolean = false): Promise<void> {
    try {
      // Check subscription for natural TTS
      const subscription = await SubscriptionService.getCurrentSubscription();
      const canUseNaturalTTS = subscription?.hasNaturalTTS || false;
      
      if (useNaturalVoice && !canUseNaturalTTS) {
        throw new Error('Natural TTS requires a paid subscription. Upgrade to Basic ($5/month) or higher.');
      }

      if (this.isSpeaking) {
        await this.stop();
      }

      const speechOptions: Speech.SpeechOptions = {
        rate: useNaturalVoice ? 0.9 : 0.8,
        pitch: useNaturalVoice ? 1.0 : 0.9,
        language: 'en-US',
      };

      // Use premium voice if available and subscribed
      if (useNaturalVoice && canUseNaturalTTS && Platform.OS !== 'web') {
        const voices = await Speech.getAvailableVoicesAsync();
        const naturalVoice = voices.find(voice => 
          voice.quality === 'Enhanced' || voice.name.includes('Premium')
        );
        if (naturalVoice) {
          speechOptions.voice = naturalVoice.identifier;
        }
      }

      if (Platform.OS !== 'web') {
        speechOptions.onStart = () => {
          this.isSpeaking = true;
        };
        speechOptions.onDone = () => {
          this.isSpeaking = false;
        };
        speechOptions.onError = () => {
          this.isSpeaking = false;
        };
      }

      await Speech.speak(text, speechOptions);
    } catch (error) {
      this.isSpeaking = false;
      throw error;
    }
  }

  static async stop(): Promise<void> {
    await Speech.stop();
    this.isSpeaking = false;
  }

  static async pause(): Promise<void> {
    if (Platform.OS !== 'web') {
      await Speech.pause();
    }
  }

  static async resume(): Promise<void> {
    if (Platform.OS !== 'web') {
      await Speech.resume();
    }
  }

  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  static async getAvailableVoices(): Promise<Speech.Voice[]> {
    if (Platform.OS !== 'web') {
      return Speech.getAvailableVoicesAsync();
    }
    return [];
  }
}