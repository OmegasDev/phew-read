import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ArrowLeft, Crown, Check, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SubscriptionService } from '@/services/subscriptionService';
import { UserSubscription } from '@/types/database';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const subscriptionData = await SubscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const upgradeSubscription = async (tierId: 'basic' | 'premium' | 'pro') => {
    try {
      setLoading(true);
      const success = await SubscriptionService.upgradeSubscription(tierId);
      if (success) {
        await loadSubscription();
        Alert.alert('Success! 🎉', 'Your subscription has been upgraded successfully!');
      } else {
        Alert.alert('Error', 'Failed to upgrade subscription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  const renderSubscriptionTier = (tier: any) => {
    const isCurrentTier = subscription?.tier === tier.id;
    const isPopular = tier.id === 'premium';
    
    return (
      <View
        key={tier.id}
        style={[
          styles.subscriptionTier,
          isCurrentTier && styles.currentSubscriptionTier,
          isPopular && styles.popularTier,
        ]}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Star size={12} color="#FFF" fill="#FFF" />
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        
        <View style={styles.tierHeader}>
          <View style={styles.tierTitleContainer}>
            <Crown size={24} color={tier.color} />
            <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.tierPrice}>
              {tier.price === 0 ? 'Free' : `$${tier.price}`}
            </Text>
            {tier.price > 0 && (
              <Text style={styles.priceUnit}>/month</Text>
            )}
          </View>
        </View>
        
        <View style={styles.tierFeatures}>
          {tier.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        {tier.booksPerMonth > 0 && (
          <View style={styles.booksIncluded}>
            <Text style={styles.booksIncludedText}>
              📚 {tier.booksPerMonth} free book{tier.booksPerMonth > 1 ? 's' : ''} per month
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentTier && styles.currentSubscribeButton,
            { backgroundColor: isCurrentTier ? '#10B981' : tier.color }
          ]}
          onPress={() => tier.id !== 'free' && !isCurrentTier && upgradeSubscription(tier.id)}
          disabled={isCurrentTier || loading}
        >
          <Text style={styles.subscribeButtonText}>
            {isCurrentTier ? 'Current Plan' : tier.id === 'free' ? 'Free Forever' : 'Upgrade Now'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Unlock premium reading features</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why upgrade?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Crown size={20} color="#F59E0B" />
              <Text style={styles.benefitText}>Access to Anna's Archive library</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={20} color="#10B981" />
              <Text style={styles.benefitText}>AI-powered explanations & summaries</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={20} color="#10B981" />
              <Text style={styles.benefitText}>Natural voice text-to-speech</Text>
            </View>
            <View style={styles.benefitItem}>
              <Check size={20} color="#10B981" />
              <Text style={styles.benefitText}>Priority customer support</Text>
            </View>
          </View>
        </View>

        {SubscriptionService.tiers.map(renderSubscriptionTier)}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All subscriptions include a 7-day free trial. Cancel anytime.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  subscriptionTier: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  currentSubscriptionTier: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  popularTier: {
    borderColor: '#8B5CF6',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceUnit: {
    fontSize: 14,
    color: '#6B7280',
  },
  tierFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  booksIncluded: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  booksIncludedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  currentSubscribeButton: {
    backgroundColor: '#10B981',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});