export interface Book {
  id: string;
  title: string;
  author?: string;
  filePath: string;
  coverImage?: string;
  lastPageRead: number;
  totalPages: number;
  categoryId?: string;
  genreTags?: string[];
  fileType: 'pdf' | 'epub' | 'txt' | 'doc';
  isCompleted: boolean;
  isFavorite: boolean;
  source: 'local' | 'annas_archive' | 'affiliate';
  price?: number;
  affiliateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  page: number;
  chapter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistory {
  id: string;
  bookId: string;
  question: string;
  answer: string;
  page?: number;
  createdAt: string;
}

export interface UserSubscription {
  id: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  price: number;
  features: string[];
  booksPerMonth: number;
  hasAI: boolean;
  hasNaturalTTS: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  ttsMode: 'offline' | 'online';
  ttsVoice: 'robotic' | 'natural';
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'sepia';
  autoSync: boolean;
}

export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  rating: number;
  coverUrl: string;
  price: number;
  affiliateUrl: string;
  description: string;
  isAvailableInArchive: boolean;
}