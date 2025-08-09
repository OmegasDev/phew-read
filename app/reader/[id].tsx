import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { 
  ArrowLeft, 
  MessageCircle, 
  Volume2, 
  FileText, 
  ChevronLeft,
  ChevronRight,
  VolumeX,
  Send,
  X
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '@/services/database';
import { FileService } from '@/services/fileService';
import { TTSService } from '@/services/ttsService';
import { AIService } from '@/services/aiService';
import { SubscriptionService } from '@/services/subscriptionService';
import { Book, Note, ChatHistory, UserSubscription } from '@/types/database';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReaderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [book, setBook] = useState<Book | null>(null);
  const [content, setContent] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  
  // Modal states
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);

  useEffect(() => {
    if (id) {
      loadBook();
      loadSubscription();
    }
  }, [id]);

  useEffect(() => {
    if (book) {
      loadChatHistory();
    }
  }, [book]);

  const loadSubscription = async () => {
    try {
      const subscriptionData = await SubscriptionService.getCurrentSubscription();
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const loadBook = async () => {
    try {
      setIsLoading(true);
      const foundBook = await db.getBookById(id!);
      
      if (!foundBook) {
        Alert.alert('Error', 'Book not found');
        router.back();
        return;
      }
      
      setBook(foundBook);
      setCurrentPage(foundBook.lastPageRead);
      
      // Load book content based on file type
      if (foundBook.fileType === 'txt') {
        const fileContent = await FileService.readTextFile(foundBook.filePath);
        setContent(fileContent);
        
        // Calculate total pages (assuming ~400 words per page)
        const words = fileContent.split(/\s+/).length;
        const pages = Math.ceil(words / 400);
        setTotalPages(pages);
      } else {
        // For PDF/EPUB/DOC, show placeholder
        setContent('This file type requires the full native version of the app for optimal reading. You can still add notes and use AI features with the visible content.');
        setTotalPages(1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load book');
      console.error('Load book error:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!book) return;
    
    try {
      const history = await db.getChatHistory(book.id);
      setChatHistory(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const getPageContent = () => {
    if (!content) return '';
    
    const wordsPerPage = 400;
    const words = content.split(/\s+/);
    const startIndex = currentPage * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    
    return words.slice(startIndex, endIndex).join(' ');
  };

  const goToPage = async (page: number) => {
    if (page < 0 || page >= totalPages) return;
    
    setCurrentPage(page);
    if (book) {
      await db.updateBookProgress(book.id, page);
      
      // Mark as completed if reached the end
      if (page >= totalPages - 1 && !book.isCompleted) {
        await db.markBookCompleted(book.id);
        Alert.alert('Congratulations!', 'You have completed this book!');
      }
    }
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const toggleTTS = async () => {
    try {
      if (isSpeaking) {
        await TTSService.stop();
        setIsSpeaking(false);
      } else {
        const pageContent = getPageContent();
        if (pageContent) {
          setIsSpeaking(true);
          const useNaturalVoice = subscription?.hasNaturalTTS || false;
          await TTSService.speak(pageContent, useNaturalVoice);
          setIsSpeaking(false);
        }
      }
    } catch (error) {
      setIsSpeaking(false);
      Alert.alert('TTS Error', error instanceof Error ? error.message : 'Failed to use text-to-speech');
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !book) return;
    
    try {
      await db.createNote({
        bookId: book.id,
        content: noteText.trim(),
        page: currentPage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setNoteText('');
      setShowNoteModal(false);
      Alert.alert('Success', 'Note added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
      console.error('Add note error:', error);
    }
  };

  const askAI = async () => {
    if (!aiQuestion.trim() || !book) return;
    
    try {
      setAiLoading(true);
      const pageContent = getPageContent();
      const response = await AIService.askQuestion(aiQuestion, pageContent, book.title, currentPage);
      
      if (response.success) {
        setAiResponse(response.content);
        
        // Save to chat history
        await db.addChatMessage({
          bookId: book.id,
          question: aiQuestion,
          answer: response.content,
          page: currentPage,
          createdAt: new Date().toISOString(),
        });
        
        await loadChatHistory();
        setAiQuestion('');
      } else {
        setAiResponse(response.error || 'AI request failed');
      }
    } catch (error) {
      setAiResponse('Failed to get AI response');
      console.error('AI request error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading book...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Book not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </Text>
        </View>
      </View>

      {/* Reader Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.readerContent}
        contentContainerStyle={styles.readerContentContainer}
      >
        <Text style={styles.pageText}>{getPageContent()}</Text>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={24} color={currentPage === 0 ? '#D1D5DB' : '#1E40AF'} />
        </TouchableOpacity>
        
        <View style={styles.pageIndicator}>
          <Text style={styles.pageNumber}>{currentPage + 1}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.navButton, currentPage >= totalPages - 1 && styles.navButtonDisabled]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRight size={24} color={currentPage >= totalPages - 1 ? '#D1D5DB' : '#1E40AF'} />
        </TouchableOpacity>
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAIModal(true)}
        >
          <MessageCircle size={24} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleTTS}
        >
          {isSpeaking ? (
            <VolumeX size={24} color="#FFF" />
          ) : (
            <Volume2 size={24} color="#FFF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowNoteModal(true)}
        >
          <FileText size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.noteContext}>
              Page {currentPage + 1} • {book.title}
            </Text>
            
            <TextInput
              style={styles.noteInput}
              placeholder="Write your note here..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, !noteText.trim() && styles.saveButtonDisabled]} 
              onPress={addNote}
              disabled={!noteText.trim()}
            >
              <Text style={styles.saveButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Modal */}
      <Modal
        visible={showAIModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={() => setShowAIModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.chatHistory}>
            {chatHistory.map((chat) => (
              <View key={chat.id} style={styles.chatMessage}>
                <Text style={styles.chatQuestion}>Q: {chat.question}</Text>
                <Text style={styles.chatAnswer}>A: {chat.answer}</Text>
                {chat.page !== undefined && (
                  <Text style={styles.chatPage}>Page {chat.page + 1}</Text>
                )}
              </View>
            ))}
            
            {aiResponse && (
              <View style={styles.chatMessage}>
                <Text style={styles.chatQuestion}>Q: {aiQuestion}</Text>
                <Text style={styles.chatAnswer}>A: {aiResponse}</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.aiInputContainer}>
            <TextInput
              style={styles.aiInput}
              placeholder="Ask about this page or book..."
              value={aiQuestion}
              onChangeText={setAiQuestion}
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.askButton, (aiLoading || !aiQuestion.trim()) && styles.askButtonDisabled]}
              onPress={askAI}
              disabled={aiLoading || !aiQuestion.trim()}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  pageInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  readerContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  readerContentContainer: {
    padding: 24,
    minHeight: screenHeight - 200,
  },
  pageText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    textAlign: 'justify',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  navButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  pageIndicator: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  noteContext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 200,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chatHistory: {
    flex: 1,
    padding: 20,
  },
  chatMessage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chatQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  chatAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 4,
  },
  chatPage: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  aiInputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    color: '#1F2937',
    maxHeight: 100,
  },
  askButton: {
    backgroundColor: '#1E40AF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  askButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});