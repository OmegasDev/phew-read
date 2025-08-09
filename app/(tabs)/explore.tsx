import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { ExternalLink, Star, Crown, Download, DollarSign } from 'lucide-react-native';
import { RecommendationService } from '@/services/recommendationService';
import { SubscriptionService } from '@/services/subscriptionService';
import { RecommendedBook, UserSubscription } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

export default function ExploreScreen() {
  const { isReady } = useDatabase();
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isReady) {
      loadData();
    }
  }, [isReady]);

  const loadData = async () => {
    try {
      const [recommendationsData, subscriptionData] = await Promise.all([
        RecommendationService.getRecommendations(),
        SubscriptionService.getCurrentSubscription(),
      ]);
      
      setRecommendations(recommendationsData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load explore data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBookAction = async (book: RecommendedBook) => {
    if (!subscription) return;

    if (book.isAvailableInArchive && subscription.booksPerMonth > 0) {
      // User can get this book for free
      Alert.alert(
        'Free Book Available!',
        `This book is available in your subscription. Would you like to add it to your library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Library', onPress: () => addFreeBook(book) },
        ]
      );
    } else {
      // Open affiliate link
      try {
        await Linking.openURL(book.affiliateUrl);
        await RecommendationService.trackBookInteraction(book.id, 'view');
      } catch (error) {
        Alert.alert('Error', 'Failed to open book link');
      }
    }
  };

  const addFreeBook = async (book: RecommendedBook) => {
    try {
      // In production, this would download from Anna's Archive
      Alert.alert('Success', `"${book.title}" has been added to your library!`);
      await RecommendationService.trackBookInteraction(book.id, 'purchase');
    } catch (error) {
      Alert.alert('Error', 'Failed to add book to library');
    }
  };

  const renderRecommendation = (book: RecommendedBook) => {
    const canGetFree = book.isAvailableInArchive && subscription && subscription.booksPerMonth > 0;
    
    return (
      <TouchableOpacity
        key={book.id}
        style={styles.bookCard}
        onPress={() => handleBookAction(book)}
      >
        <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
        
        {canGetFree && (
          <View style={styles.freeTag}>
            <Crown size={12} color="#FFF" />
            <Text style={styles.freeTagText}>FREE</Text>
          </View>
        )}
        
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {book.author}
          </Text>
          
          <View style={styles.bookMeta}>
            <View style={styles.ratingContainer}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.rating}>{book.rating}</Text>
            </View>
            <Text style={styles.genre}>{book.genre}</Text>
          </View>
          
          <Text style={styles.bookDescription} numberOfLines={3}>
            {book.description}
          </Text>
          
          <View style={styles.actionContainer}>
            {canGetFree ? (
              <View style={styles.freeAction}>
                <Download size={16} color="#10B981" />
                <Text style={styles.freeActionText}>Add Free</Text>
              </View>
            ) : (
              <View style={styles.priceAction}>
                <DollarSign size={16} color="#1E40AF" />
                <Text style={styles.priceText}>${book.price}</Text>
                <ExternalLink size={14} color="#6B7280" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Crown size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Books</Text>
        <Text style={styles.subtitle}>Curated for your taste</Text>
      </View>

      {subscription && (
        <View style={styles.subscriptionBanner}>
          <View style={styles.subscriptionInfo}>
            <Crown size={20} color="#F59E0B" />
            <Text style={styles.subscriptionText}>
              {subscription.tier.toUpperCase()} • {subscription.booksPerMonth} free books/month
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        
        {recommendations.length > 0 ? (
          recommendations.map(renderRecommendation)
        ) : (
          <View style={styles.emptyRecommendations}>
            <Crown size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No recommendations yet</Text>
            <Text style={styles.emptySubtitle}>
              Add more books to your library to get personalized recommendations
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  subscriptionBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  freeTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  freeTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 2,
  },
  bookDetails: {
    flex: 1,
    marginLeft: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  genre: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  bookDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  freeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  priceAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginLeft: 4,
    marginRight: 8,
  },
  emptyRecommendations: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});