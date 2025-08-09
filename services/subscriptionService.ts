import { db } from './database';
import { UserSubscription } from '@/types/database';

interface SubscriptionTier {
  id: 'free' | 'basic' | 'premium' | 'pro';
  name: string;
  price: number;
  features: string[];
  booksPerMonth: number;
  hasAI: boolean;
  hasNaturalTTS: boolean;
  color: string;
}

export class SubscriptionService {
  static readonly tiers: SubscriptionTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Basic reading', 'Notes', 'Basic TTS (robotic)', 'Local files only'],
      booksPerMonth: 0,
      hasAI: false,
      hasNaturalTTS: false,
      color: '#6B7280',
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 5,
      features: ['Everything in Free', 'AI explanations', '1 free book/month', 'Natural TTS'],
      booksPerMonth: 1,
      hasAI: true,
      hasNaturalTTS: true,
      color: '#3B82F6',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 8,
      features: ['Everything in Basic', '2 free books/month', 'Priority AI responses', 'Advanced search'],
      booksPerMonth: 2,
      hasAI: true,
      hasNaturalTTS: true,
      color: '#8B5CF6',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 10,
      features: ['Everything in Premium', '5 free books/month', 'Unlimited AI chat', 'Early access features'],
      booksPerMonth: 5,
      hasAI: true,
      hasNaturalTTS: true,
      color: '#F59E0B',
    },
  ];

  static async getCurrentSubscription(): Promise<UserSubscription | null> {
    return await db.getUserSubscription();
  }

  static async upgradeSubscription(tierId: 'basic' | 'premium' | 'pro'): Promise<boolean> {
    try {
      const tier = this.tiers.find(t => t.id === tierId);
      if (!tier) return false;

      const subscription: Partial<UserSubscription> = {
        tier: tier.id,
        price: tier.price,
        features: tier.features,
        booksPerMonth: tier.booksPerMonth,
        hasAI: tier.hasAI,
        hasNaturalTTS: tier.hasNaturalTTS,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      };

      await db.updateSubscription(subscription);
      return true;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }

  static async cancelSubscription(): Promise<boolean> {
    try {
      const freeSubscription: Partial<UserSubscription> = {
        tier: 'free',
        price: 0,
        features: this.tiers[0].features,
        booksPerMonth: 0,
        hasAI: false,
        hasNaturalTTS: false,
        expiresAt: undefined,
      };

      await db.updateSubscription(freeSubscription);
      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  static getTierByName(tierName: string): SubscriptionTier | undefined {
    return this.tiers.find(tier => tier.id === tierName);
  }

  static canAccessFeature(userTier: string, feature: 'ai' | 'naturalTTS' | 'freeBooks'): boolean {
    const tier = this.getTierByName(userTier);
    if (!tier) return false;

    switch (feature) {
      case 'ai':
        return tier.hasAI;
      case 'naturalTTS':
        return tier.hasNaturalTTS;
      case 'freeBooks':
        return tier.booksPerMonth > 0;
      default:
        return false;
    }
  }
}