import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Search, MessageCircle, FileText, Calendar, BookOpen } from 'lucide-react-native';
import { db } from '@/services/database';
import { Note, ChatHistory } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

interface SavedItem {
  id: string;
  type: 'note' | 'chat';
  bookTitle: string;
  content: string;
  page?: number;
  question?: string;
  answer?: string;
  createdAt: string;
}

export default function SavedScreen() {
  const { isReady } = useDatabase();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'notes' | 'chats'>('all');

  useEffect(() => {
    if (isReady) {
      loadSavedItems();
    }
  }, [isReady]);

  useEffect(() => {
    filterItems();
  }, [savedItems, searchQuery, activeFilter]);

  const loadSavedItems = async () => {
    try {
      const [notesData, chatsData] = await Promise.all([
        db.getAllNotes(),
        db.getAllChatHistory(),
      ]);

      const items: SavedItem[] = [
        ...notesData.map(note => ({
          id: note.id,
          type: 'note' as const,
          bookTitle: note.bookTitle,
          content: note.content,
          page: note.page,
          createdAt: note.createdAt,
        })),
        ...chatsData.map(chat => ({
          id: chat.id,
          type: 'chat' as const,
          bookTitle: chat.bookTitle,
          content: chat.answer,
          question: chat.question,
          answer: chat.answer,
          page: chat.page,
          createdAt: chat.createdAt,
        })),
      ];

      // Sort by creation date (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSavedItems(items);
    } catch (error) {
      console.error('Failed to load saved items:', error);
    }
  };

  const filterItems = () => {
    let filtered = savedItems;

    // Filter by type
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => 
        activeFilter === 'notes' ? item.type === 'note' : item.type === 'chat'
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.question && item.question.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredItems(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSavedItem = ({ item }: { item: SavedItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <View style={styles.itemTypeContainer}>
            {item.type === 'note' ? (
              <FileText size={16} color="#10B981" />
            ) : (
              <MessageCircle size={16} color="#3B82F6" />
            )}
            <Text style={styles.itemType}>
              {item.type === 'note' ? 'Note' : 'AI Chat'}
            </Text>
          </View>
          <View style={styles.bookTitleContainer}>
            <BookOpen size={14} color="#6B7280" />
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.bookTitle}
            </Text>
            {item.page !== undefined && (
              <Text style={styles.pageInfo}>• Page {item.page + 1}</Text>
            )}
          </View>
        </View>
      </View>
      
      {item.type === 'chat' && item.question && (
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Question:</Text>
          <Text style={styles.questionText}>{item.question}</Text>
        </View>
      )}
      
      <Text style={styles.itemContent} numberOfLines={item.type === 'chat' ? 6 : 4}>
        {item.type === 'chat' ? item.answer : item.content}
      </Text>
      
      <View style={styles.itemFooter}>
        <Calendar size={14} color="#9CA3AF" />
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <FileText size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading saved items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <Text style={styles.itemsCount}>{savedItems.length} items</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes and AI chats..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'notes', 'chats'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
              {filter === 'all' ? 'All' : filter === 'notes' ? 'Notes' : 'AI Chats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {savedItems.length === 0 ? 'No saved items yet' : 'No matching items'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {savedItems.length === 0 
              ? 'Your notes and AI conversations will appear here'
              : 'Try adjusting your search or filter'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderSavedItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.itemsList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  itemsCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterButton: {
    backgroundColor: '#1E40AF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  itemsList: {
    padding: 20,
    paddingTop: 10,
  },
  itemCard: {
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
  itemHeader: {
    marginBottom: 12,
  },
  itemInfo: {
    gap: 8,
  },
  itemTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  bookTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 6,
    flex: 1,
  },
  pageInfo: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  itemContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  },
});