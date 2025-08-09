import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Palette, 
  Type, 
  Crown, 
  CreditCard,
  Check,
  X
} from 'lucide-react-native';
import { db } from '@/services/database';
import { SubscriptionService } from '@/services/subscriptionService';
import { AppSettings, UserSubscription } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

export default function SettingsScreen() {
  const { isReady } = useDatabase();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  const loadData = async () => {
    try {
      const [settingsData, subscriptionData] = await Promise.all([
        db.getSettings(),
        SubscriptionService.getCurrentSubscription(),
      ]);
      setSettings(settingsData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    
    try {
      await db.updateSettings({ [key]: value });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
      console.error('Update setting error:', error);
    }
  };

  const upgradeSubscription = async (tierId: 'basic' | 'premium' | 'pro') => {
    try {
      const success = await SubscriptionService.upgradeSubscription(tierId);
      if (success) {
        await loadData();
        setShowSubscriptionModal(false);
        Alert.alert('Success', 'Subscription upgraded successfully!');
      } else {
        Alert.alert('Error', 'Failed to upgrade subscription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription');
    }
  };

  const renderSubscriptionTier = (tier: any) => {
    const isCurrentTier = subscription?.tier === tier.id;
    
    return (
      <TouchableOpacity
        key={tier.id}
        style={[
          styles.subscriptionTier,
          isCurrentTier && styles.currentSubscriptionTier,
          { borderColor: tier.color }
        ]}
        onPress={() => tier.id !== 'free' && !isCurrentTier && upgradeSubscription(tier.id)}
        disabled={isCurrentTier}
      >
        <View style={styles.tierHeader}>
          <View style={styles.tierTitleContainer}>
            <Crown size={20} color={tier.color} />
            <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
          </View>
          <Text style={styles.tierPrice}>
            {tier.price === 0 ? 'Free' : `$${tier.price}/month`}
          </Text>
        </View>
        
        <View style={styles.tierFeatures}>
          {tier.features.map((feature: string, index: number) => (
            <View key={index} style={styles.featureRow}>
              <Check size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        {isCurrentTier && (
          <View style={styles.currentTierBadge}>
            <Text style={styles.currentTierText}>Current Plan</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSetting = (
    icon: React.ReactNode,
    title: string,
    description: string,
    action: React.ReactNode
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingAction}>{action}</View>
    </View>
  );

  if (!isReady || !settings || !subscription) {
    return (
      <View style={styles.loadingContainer}>
        <SettingsIcon size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Subscription Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => setShowSubscriptionModal(true)}
            >
              <CreditCard size={20} color="#1E40AF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.currentSubscription}>
            <View style={styles.subscriptionInfo}>
              <Crown size={24} color="#F59E0B" />
              <View style={styles.subscriptionDetails}>
                <Text style={styles.subscriptionTier}>
                  {subscription.tier.toUpperCase()} PLAN
                </Text>
                <Text style={styles.subscriptionPrice}>
                  {subscription.price === 0 ? 'Free' : `$${subscription.price}/month`}
                </Text>
              </View>
            </View>
            {subscription.booksPerMonth > 0 && (
              <Text style={styles.subscriptionBenefit}>
                {subscription.booksPerMonth} free books per month
              </Text>
            )}
          </View>
        </View>

        {/* Reading Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Experience</Text>
          
          {renderSetting(
            <Volume2 size={24} color="#1E40AF" />,
            'Text-to-Speech Voice',
            subscription.hasNaturalTTS ? 'Natural voice available' : 'Upgrade for natural voice',
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => updateSetting('ttsVoice', settings.ttsVoice === 'robotic' ? 'natural' : 'robotic')}
              disabled={!subscription.hasNaturalTTS && settings.ttsVoice === 'natural'}
            >
              <Text style={styles.optionText}>
                {settings.ttsVoice === 'robotic' ? 'Robotic' : 'Natural'}
              </Text>
            </TouchableOpacity>
          )}

          {renderSetting(
            <Type size={24} color="#1E40AF" />,
            'Font Size',
            'Adjust reading text size',
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                const sizes = ['small', 'medium', 'large'];
                const currentIndex = sizes.indexOf(settings.fontSize);
                const nextIndex = (currentIndex + 1) % sizes.length;
                updateSetting('fontSize', sizes[nextIndex]);
              }}
            >
              <Text style={styles.optionText}>
                {settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
              </Text>
            </TouchableOpacity>
          )}

          {renderSetting(
            <Palette size={24} color="#1E40AF" />,
            'Theme',
            'Choose your reading theme',
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                const themes = ['light', 'dark', 'sepia'];
                const currentIndex = themes.indexOf(settings.theme);
                const nextIndex = (currentIndex + 1) % themes.length;
                updateSetting('theme', themes[nextIndex]);
              }}
            >
              <Text style={styles.optionText}>
                {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Info */}
        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>Phew Readers</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDescription}>
            Your complete reading companion with AI-powered insights and personalized recommendations.
          </Text>
        </View>
      </ScrollView>

      {/* Subscription Modal */}
      <Modal
        visible={showSubscriptionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Your Plan</Text>
            <TouchableOpacity onPress={() => setShowSubscriptionModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {SubscriptionService.tiers.map(renderSubscriptionTier)}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1E40AF',
    fontWeight: '500',
  },
  header: {
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  manageButton: {
    padding: 4,
  },
  currentSubscription: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionDetails: {
    marginLeft: 12,
  },
  subscriptionTier: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subscriptionPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  subscriptionBenefit: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  settingAction: {
    marginLeft: 16,
  },
  optionButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  subscriptionTier: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  currentSubscriptionTier: {
    backgroundColor: '#F0F9FF',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tierTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tierPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tierFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  currentTierBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentTierText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
});