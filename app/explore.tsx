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
  Dimensions,
} from 'react-native';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Crown, 
  Download, 
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { RecommendationService } from '@/services/recommendationService';
import { SubscriptionService } from '@/services/subscriptionService';
import { RecommendedBook, UserSubscription } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

const { width: screenWidth } = Dimensions.get('window');

export default function ExploreScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');

  const genres = ['all', 'finance', 'business', 'fiction', 'technical', 'selfhelp', 'biography'];

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
      Alert.alert(
        'Free Book Available! 📚',
        `This book is included in your ${subscription.tier.toUpperCase()} subscription. Add it to your library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Library', onPress: () => addFreeBook(book) },
        ]
      );
    } else {
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
      Alert.alert('Success! 🎉', `"${book.title}" has been added to your library!`);
      await RecommendationService.trackBookInteraction(book.id, 'purchase');
    } catch (error) {
      Alert.alert('Error', 'Failed to add book to library');
    }
  };

  const filteredRecommendations = selectedGenre === 'all' 
    ? recommendations 
    : recommendations.filter(book => book.genre.toLowerCase() === selectedGenre);

  const renderRecommendation = (book: RecommendedBook) => {
    const canGetFree = book.isAvailableInArchive && subscription && subscription.booksPerMonth > 0;
    
    return (
      <TouchableOpacity
        key={book.id}
        style={styles.bookCard}
        onPress={() => handleBookAction(book)}
      >
        <View style={styles.bookImageContainer}>
          <Image source={{ uri: book.coverUrl }} style={styles.bookCover} />
          
          {canGetFree && (
            <View style={styles.freeTag}>
              <Crown size={12} color="#FFF" />
              <Text style={styles.freeTagText}>FREE</Text>
            </View>
          )}
          
          <View style={styles.ratingBadge}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>{book.rating}</Text>
          </View>
        </View>
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            by {book.author}
          </Text>
          <Text style={styles.bookGenre}>{book.genre}</Text>
          
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
        <TrendingUp size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Explore Books</Text>
          <Text style={styles.subtitle}>Discover your next great read</Text>
        </View>
      </View>

      {subscription && (
        <View style={styles.subscriptionBanner}>
          <Crown size={20} color="#F59E0B" />
          <Text style={styles.subscriptionText}>
            {subscription.tier.toUpperCase()} • {subscription.booksPerMonth} free books/month
          </Text>
          {subscription.tier === 'free' && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => router.push('/subscription' as any)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Genre Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.genreFilter}
        contentContainerStyle={styles.genreFilterContent}
      >
        {genres.map((genre) => (
          <TouchableOpacity
            key={genre}
            style={[
              styles.genreButton,
              selectedGenre === genre && styles.activeGenreButton
            ]}
            onPress={() => setSelectedGenre(genre)}
          >
            <Text style={[
              styles.genreButtonText,
              selectedGenre === genre && styles.activeGenreButtonText
            ]}>
              {genre === 'all' ? 'All' : genre.charAt(0).toUpperCase() + genre.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRecommendations.length > 0 ? (
          <View style={styles.booksGrid}>
            {filteredRecommendations.map(renderRecommendation)}
          </View>
        ) : (
          <View style={styles.emptyRecommendations}>
            <TrendingUp size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No recommendations</Text>
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
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  subscriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  genreFilter: {
    marginTop: 20,
  },
  genreFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  genreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeGenreButton: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeGenreButtonText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  bookImageContainer: {
    position: 'relative',
  },
  bookCover: {
    width: '100%',
    height: 180,
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
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 2,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 2,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookGenre: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  actionContainer: {
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
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  priceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginLeft: 4,
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