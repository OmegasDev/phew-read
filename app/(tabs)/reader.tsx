import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { BookOpen, Clock, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ReaderScreen() {
  const router = useRouter();

  const recentBooks = [
    {
      id: '1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      progress: 65,
      lastRead: '2 hours ago',
    },
    {
      id: '2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      progress: 23,
      lastRead: '1 day ago',
    },
  ];

  const openBook = (bookId: string) => {
    router.push(`/reader/${bookId}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Continue Reading</Text>
        <Text style={styles.subtitle}>Pick up where you left off</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Read</Text>
          
          {recentBooks.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={styles.bookCard}
              onPress={() => openBook(book.id)}
            >
              <View style={styles.bookCover}>
                <Text style={styles.bookCoverText}>
                  {book.title.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>by {book.author}</Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${book.progress}%` }]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{book.progress}%</Text>
                </View>
                
                <View style={styles.lastReadContainer}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.lastReadText}>{book.lastRead}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.emptyState}>
          <BookOpen size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Start Reading</Text>
          <Text style={styles.emptySubtitle}>
            Go to your Library to select a book and start reading
          </Text>
          <TouchableOpacity 
            style={styles.libraryButton}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={styles.libraryButtonText}>Go to Library</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookCoverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    minWidth: 35,
  },
  lastReadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastReadText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 24,
  },
  libraryButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  libraryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});