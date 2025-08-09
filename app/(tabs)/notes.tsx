import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Search, FileText, Trash2, Calendar, BookOpen } from 'lucide-react-native';
import { db } from '@/services/database';
import { Note } from '@/types/database';
import { useDatabase } from '@/contexts/DatabaseContext';

interface NoteWithBook extends Note {
  bookTitle: string;
}

export default function NotesScreen() {
  const { isReady } = useDatabase();
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<NoteWithBook[]>([]);

  useEffect(() => {
    if (isReady) {
      loadNotes();
    }
  }, [isReady]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery]);

  const loadNotes = async () => {
    try {
      const notesData = await db.getAllNotes();
      setNotes(notesData);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const filterNotes = () => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const filtered = notes.filter(note =>
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.chapter?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNotes(filtered);
  };

  const deleteNote = async (noteId: string) => {
    try {
      await db.deleteNote(noteId);
      await loadNotes();
      Alert.alert('Success', 'Note deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete note');
      console.error('Delete note error:', error);
    }
  };

  const confirmDelete = (note: NoteWithBook) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(note.id) },
      ]
    );
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

  const renderNote = ({ item }: { item: NoteWithBook }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteInfo}>
          <View style={styles.bookTitleContainer}>
            <BookOpen size={16} color="#1E40AF" />
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.bookTitle}
            </Text>
          </View>
          <View style={styles.noteMeta}>
            <Text style={styles.pageInfo}>Page {item.page + 1}</Text>
            {item.chapter && (
              <Text style={styles.chapterInfo} numberOfLines={1}>
                • {item.chapter}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.noteContent}>{item.content}</Text>
      
      <View style={styles.noteFooter}>
        <Calendar size={14} color="#9CA3AF" />
        <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <FileText size={48} color="#1E40AF" />
        <Text style={styles.loadingText}>Loading your notes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Notes</Text>
        <Text style={styles.notesCount}>{notes.length} notes</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, books, or chapters..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {notes.length === 0 
              ? 'Start reading and add notes to see them here'
              : 'Try adjusting your search query'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
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
  notesCount: {
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
  notesList: {
    padding: 20,
    paddingTop: 10,
  },
  noteCard: {
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
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteInfo: {
    flex: 1,
    marginRight: 12,
  },
  bookTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageInfo: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  chapterInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDate: {
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