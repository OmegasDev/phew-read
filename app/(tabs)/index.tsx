import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Plus, Search, Grid2x2 as Grid, List, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { db } from '@/services/database';
import { FileService } from '@/services/fileService';
import { Book, Category } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

const { width: screenWidth } = Dimensions.get('window');

export default function LibraryScreen() {
  const router = useRouter();
  const { isReady } = useDatabase();
  const [activeTab, setActiveTab] = useState<'my-library' | 'all-books'>('my-library');
  const [categories, setCategories] = useState<Category[]>([]);
  const [booksByCategory, setBooksByCategory] = useState<{ [categoryId: string]: Book[] }>({});
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isReady) {
      loadLibrary();
    }
  }, [isReady]);

  const loadLibrary = async () => {
    try {
      const categoriesData = await db.getCategories();
      setCategories(categoriesData);

      const booksData: { [categoryId: string]: Book[] } = {};
      for (const category of categoriesData) {
        booksData[category.id] = await db.getBooksByCategory(category.id);
      }
      setBooksByCategory(booksData);

      const allBooksData = await db.getAllBooks();
      setAllBooks(allBooksData);
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLibrary();
    setRefreshing(false);
  };

  const addBook = async () => {
    try {
      const result = await FileService.pickDocument();
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = `${Date.now()}_${asset.name}`;
        const localPath = await FileService.copyToAppDirectory(asset.uri, filename);
        
        let content = '';
        if (FileService.getFileTypeFromUri(asset.name) === 'txt') {
          content = await FileService.readTextFile(localPath);
        }

        const book: Omit<Book, 'id'> = {
          title: asset.name.replace(/\.[^/.]+$/, ''),
          author: FileService.extractAuthorFromFilename(asset.name),
          filePath: localPath,
          lastPageRead: 0,
          totalPages: 0,
          categoryId: '2', // Default to "Leisure"
          genreTags: FileService.detectGenre(asset.name, content),
          fileType: FileService.getFileTypeFromUri(asset.name),
          isCompleted: false,
          isFavorite: false,
          source: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.createBook(book);
        await loadLibrary();
        
        Alert.alert('Success', 'Book added to your library!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add book to library');
      console.error('Add book error:', error);
    }
  };

  const openBook = (book: Book) => {
    router.push(`/reader/${book.id}` as any);
  };

  const toggleFavorite = async (book: Book) => {
    try {
      await db.toggleBookFavorite(book.id);
      await loadLibrary();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const renderBookGrid = (book: Book) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCardGrid}
      onPress={() => openBook(book)}
    >
      <View style={styles.bookCoverContainer}>
        {book.coverImage ? (
          <Image source={{ uri: book.coverImage }} style={styles.bookCover} />
        ) : (
          <View style={[styles.bookCoverPlaceholder, { backgroundColor: '#E5E7EB' }]}>
            <Text style={styles.bookCoverText}>{book.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(book)}
        >
          <Heart 
            size={16} 
            color={book.isFavorite ? '#EF4444' : '#9CA3AF'} 
            fill={book.isFavorite ? '#EF4444' : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.bookTitleGrid} numberOfLines={2}>
        {book.title}
      </Text>
      {book.author && (
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {book.author}
        </Text>
      )}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${book.totalPages > 0 ? (book.lastPageRead / book.totalPages) * 100 : 0}%` }
          ]} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderBookList = (book: Book) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCardList}
      onPress={() => openBook(book)}
    >
      <View style={styles.bookCoverSmall}>
        {book.coverImage ? (
          <Image source={{ uri: book.coverImage }} style={styles.bookCoverSmallImage} />
        ) : (
          <View style={[styles.bookCoverPlaceholder, styles.bookCoverSmallPlaceholder]}>
            <Text style={styles.bookCoverTextSmall}>{book.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.bookInfoList}>
        <Text style={styles.bookTitleList} numberOfLines={1}>
          {book.title}
        </Text>
        {book.author && (
          <Text style={styles.bookAuthorList} numberOfLines={1}>
            by {book.author}
          </Text>
        )}
        <Text style={styles.bookMeta}>
          {book.fileType.toUpperCase()} • Page {book.lastPageRead + 1}
          {book.totalPages > 0 && ` of ${book.totalPages}`}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButtonList}
        onPress={() => toggleFavorite(book)}
      >
        <Heart 
          size={20} 
          color={book.isFavorite ? '#EF4444' : '#9CA3AF'} 
          fill={book.isFavorite ? '#EF4444' : 'transparent'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCategory = (category: Category) => {
    const books = booksByCategory[category.id] || [];
    
    return (
      <View key={category.id} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
              <Text style={styles.categoryIconText}>{category.name.charAt(0)}</Text>
            </View>
            <Text style={styles.categoryTitle}>{category.name}</Text>
          </View>
          <Text style={styles.bookCount}>{books.length} books</Text>
        </View>
        
        {books.length > 0 ? (
          viewMode === 'grid' ? (
            <View style={styles.booksGrid}>
              {books.map(renderBookGrid)}
            </View>
          ) : (
            <View style={styles.booksList}>
              {books.map(renderBookList)}
            </View>
          )
        ) : (
          <View style={styles.emptyCategory}>
            <Text style={styles.emptyCategoryText}>No books in this category</Text>
            <Text style={styles.emptyCategorySubtext}>Add books to organize your library</Text>
          </View>
        )}
      </View>
    );
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <BookOpen size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading your library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phew Readers</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={24} color="#1E40AF" />
            ) : (
              <Grid size={24} color="#1E40AF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addBook}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-library' && styles.activeTab]}
          onPress={() => setActiveTab('my-library')}
        >
          <Text style={[styles.tabText, activeTab === 'my-library' && styles.activeTabText]}>
            My Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all-books' && styles.activeTab]}
          onPress={() => setActiveTab('all-books')}
        >
          <Text style={[styles.tabText, activeTab === 'all-books' && styles.activeTabText]}>
            All Books
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'my-library' ? (
          categories.map(renderCategory)
        ) : (
          <View style={styles.allBooksContainer}>
            {allBooks.length > 0 ? (
              viewMode === 'grid' ? (
                <View style={styles.booksGrid}>
                  {allBooks.map(renderBookGrid)}
                </View>
              ) : (
                <View style={styles.booksList}>
                  {allBooks.map(renderBookList)}
                </View>
              )
            ) : (
              <View style={styles.emptyLibrary}>
                <BookOpen size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No books yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the + button to add your first book
                </Text>
              </View>
            )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    marginRight: 12,
    padding: 8,
  },
  addButton: {
    backgroundColor: '#1E40AF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1E40AF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  bookCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  booksList: {
    gap: 12,
  },
  bookCardGrid: {
    width: (screenWidth - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCardList: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookCoverContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  bookCover: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  bookCoverPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bookTitleGrid: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  bookCoverSmall: {
    marginRight: 16,
  },
  bookCoverSmallImage: {
    width: 60,
    height: 80,
    borderRadius: 6,
  },
  bookCoverSmallPlaceholder: {
    width: 60,
    height: 80,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverTextSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  bookInfoList: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitleList: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookAuthorList: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  favoriteButtonList: {
    padding: 8,
    justifyContent: 'center',
  },
  allBooksContainer: {
    paddingBottom: 20,
  },
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyCategoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyCategorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyLibrary: {
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
  },
});