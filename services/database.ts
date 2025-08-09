import * as SQLite from 'expo-sqlite';
import { Book, Category, Note, ChatHistory, UserSubscription, AppSettings } from '@/types/database';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync('phew_readers.db');
    await this.createTables();
    await this.createDefaultData();
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Books table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        filePath TEXT NOT NULL,
        coverImage TEXT,
        lastPageRead INTEGER DEFAULT 0,
        totalPages INTEGER DEFAULT 0,
        categoryId TEXT,
        genreTags TEXT,
        fileType TEXT NOT NULL,
        isCompleted INTEGER DEFAULT 0,
        isFavorite INTEGER DEFAULT 0,
        source TEXT DEFAULT 'local',
        price REAL,
        affiliateUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories (id)
      )
    `);

    // Notes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        bookId TEXT NOT NULL,
        content TEXT NOT NULL,
        page INTEGER NOT NULL,
        chapter TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id)
      )
    `);

    // Chat history table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS chatHistory (
        id TEXT PRIMARY KEY,
        bookId TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        page INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (bookId) REFERENCES books (id)
      )
    `);

    // User subscription table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS userSubscription (
        id TEXT PRIMARY KEY,
        tier TEXT NOT NULL,
        price REAL NOT NULL,
        features TEXT NOT NULL,
        booksPerMonth INTEGER NOT NULL,
        hasAI INTEGER DEFAULT 0,
        hasNaturalTTS INTEGER DEFAULT 0,
        expiresAt TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        ttsMode TEXT DEFAULT 'offline',
        ttsVoice TEXT DEFAULT 'robotic',
        fontSize TEXT DEFAULT 'medium',
        theme TEXT DEFAULT 'light',
        autoSync INTEGER DEFAULT 0
      )
    `);
  }

  private async createDefaultData() {
    if (!this.db) return;

    // Default categories
    const defaultCategories = [
      { id: '1', name: 'Finance', icon: 'DollarSign', color: '#10B981', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: 'Leisure', icon: 'Coffee', color: '#F59E0B', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', name: 'Discipline', icon: 'Target', color: '#EF4444', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '4', name: 'Read', icon: 'CheckCircle', color: '#8B5CF6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '5', name: 'Favorites', icon: 'Heart', color: '#EC4899', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    for (const category of defaultCategories) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO categories (id, name, icon, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [category.id, category.name, category.icon, category.color, category.createdAt, category.updatedAt]
      );
    }

    // Default subscription (free tier)
    await this.db.runAsync(
      'INSERT OR IGNORE INTO userSubscription (id, tier, price, features, booksPerMonth, hasAI, hasNaturalTTS, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['1', 'free', 0, JSON.stringify(['Basic reading', 'Notes', 'Basic TTS']), 0, 0, 0, new Date().toISOString()]
    );

    // Default settings
    await this.db.runAsync(
      'INSERT OR IGNORE INTO settings (id, ttsMode, ttsVoice, fontSize, theme, autoSync) VALUES (?, ?, ?, ?, ?, ?)',
      ['1', 'offline', 'robotic', 'medium', 'light', 0]
    );
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM categories ORDER BY name');
    return result as Category[];
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const id = Date.now().toString();
    await this.db.runAsync(
      'INSERT INTO categories (id, name, icon, color, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, category.name, category.icon, category.color, category.createdAt, category.updatedAt]
    );
    return id;
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  }

  // Books
  async getAllBooks(): Promise<Book[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM books ORDER BY title');
    return result.map((book: {
      id: string;
      title: string;
      author: string | null;
      filePath: string;
      coverImage: string | null;
      lastPageRead: number;
      totalPages: number;
      categoryId: string | null;
      genreTags: string | null;
      fileType: string;
      isCompleted: number;
      isFavorite: number;
      source: string;
      price: number | null;
      affiliateUrl: string | null;
      createdAt: string;
      updatedAt: string;
    }) => ({
      ...book,
      genreTags: book.genreTags ? JSON.parse(book.genreTags) : [],
      isCompleted: Boolean(book.isCompleted),
      isFavorite: Boolean(book.isFavorite),
    })) as Book[];
  }

  async getBooksByCategory(categoryId: string): Promise<Book[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM books WHERE categoryId = ? ORDER BY title', [categoryId]);
    return result.map((book: {
      id: string;
      title: string;
      author: string | null;
      filePath: string;
      coverImage: string | null;
      lastPageRead: number;
      totalPages: number;
      categoryId: string | null;
      genreTags: string | null;
      fileType: string;
      isCompleted: number;
      isFavorite: number;
      source: string;
      price: number | null;
      affiliateUrl: string | null;
      createdAt: string;
      updatedAt: string;
    }) => ({
      ...book,
      genreTags: book.genreTags ? JSON.parse(book.genreTags) : [],
      isCompleted: Boolean(book.isCompleted),
      isFavorite: Boolean(book.isFavorite),
    })) as Book[];
  }

  async getBookById(id: string): Promise<Book | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM books WHERE id = ?', [id]);
    if (!result) return null;
    
    return {
      ...result,
      genreTags: result.genreTags ? JSON.parse(result.genreTags) : [],
      isCompleted: Boolean(result.isCompleted),
      isFavorite: Boolean(result.isFavorite),
    } as Book;
  }

  async createBook(book: Omit<Book, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const id = Date.now().toString();
    await this.db.runAsync(
      'INSERT INTO books (id, title, author, filePath, coverImage, lastPageRead, totalPages, categoryId, genreTags, fileType, isCompleted, isFavorite, source, price, affiliateUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id, book.title, book.author, book.filePath, book.coverImage, 
        book.lastPageRead, book.totalPages, book.categoryId, 
        JSON.stringify(book.genreTags || []), book.fileType, 
        book.isCompleted ? 1 : 0, book.isFavorite ? 1 : 0, 
        book.source, book.price, book.affiliateUrl, 
        book.createdAt, book.updatedAt
      ]
    );
    return id;
  }

  async updateBookProgress(bookId: string, lastPageRead: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE books SET lastPageRead = ?, updatedAt = ? WHERE id = ?',
      [lastPageRead, new Date().toISOString(), bookId]
    );
  }

  async updateBookCategory(bookId: string, categoryId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE books SET categoryId = ?, updatedAt = ? WHERE id = ?',
      [categoryId, new Date().toISOString(), bookId]
    );
  }

  async toggleBookFavorite(bookId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const book = await this.getBookById(bookId);
    if (!book) return;
    
    await this.db.runAsync(
      'UPDATE books SET isFavorite = ?, updatedAt = ? WHERE id = ?',
      [book.isFavorite ? 0 : 1, new Date().toISOString(), bookId]
    );
  }

  async markBookCompleted(bookId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE books SET isCompleted = 1, categoryId = ?, updatedAt = ? WHERE id = ?',
      ['4', new Date().toISOString(), bookId] // Move to "Read" category
    );
  }

  // Notes
  async getNotesByBook(bookId: string): Promise<Note[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM notes WHERE bookId = ? ORDER BY page, createdAt', [bookId]);
    return result as Note[];
  }

  async getAllNotes(): Promise<(Note & { bookTitle: string })[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync(`
      SELECT n.*, b.title as bookTitle 
      FROM notes n 
      JOIN books b ON n.bookId = b.id 
      ORDER BY n.createdAt DESC
    `);
    return result as (Note & { bookTitle: string })[];
  }

  async createNote(note: Omit<Note, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const id = Date.now().toString();
    await this.db.runAsync(
      'INSERT INTO notes (id, bookId, content, page, chapter, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, note.bookId, note.content, note.page, note.chapter, note.createdAt, note.updatedAt]
    );
    return id;
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  }

  // Chat History
  async getChatHistory(bookId: string): Promise<ChatHistory[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync('SELECT * FROM chatHistory WHERE bookId = ? ORDER BY createdAt', [bookId]);
    return result as ChatHistory[];
  }

  async getAllChatHistory(): Promise<(ChatHistory & { bookTitle: string })[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getAllAsync(`
      SELECT c.*, b.title as bookTitle 
      FROM chatHistory c 
      JOIN books b ON c.bookId = b.id 
      ORDER BY c.createdAt DESC
    `);
    return result as (ChatHistory & { bookTitle: string })[];
  }

  async addChatMessage(chat: Omit<ChatHistory, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    const id = Date.now().toString();
    await this.db.runAsync(
      'INSERT INTO chatHistory (id, bookId, question, answer, page, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, chat.bookId, chat.question, chat.answer, chat.page, chat.createdAt]
    );
    return id;
  }

  async clearChatHistory(bookId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM chatHistory WHERE bookId = ?', [bookId]);
  }

  // Subscription
  async getUserSubscription(): Promise<UserSubscription | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM userSubscription WHERE id = ?', ['1']);
    if (!result) return null;
    
    return {
      ...result,
      features: JSON.parse(result.features),
      hasAI: Boolean(result.hasAI),
      hasNaturalTTS: Boolean(result.hasNaturalTTS),
    } as UserSubscription;
  }

  async updateSubscription(subscription: Partial<UserSubscription>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const current = await this.getUserSubscription();
    if (!current) return;

    const updated = { ...current, ...subscription };
    await this.db.runAsync(
      'UPDATE userSubscription SET tier = ?, price = ?, features = ?, booksPerMonth = ?, hasAI = ?, hasNaturalTTS = ?, expiresAt = ? WHERE id = ?',
      [
        updated.tier, updated.price, JSON.stringify(updated.features), 
        updated.booksPerMonth, updated.hasAI ? 1 : 0, updated.hasNaturalTTS ? 1 : 0, 
        updated.expiresAt, '1'
      ]
    );
  }

  // Settings
  async getSettings(): Promise<AppSettings | null> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync('SELECT * FROM settings WHERE id = ?', ['1']);
    if (!result) return null;
    
    return {
      ...result,
      autoSync: Boolean(result.autoSync),
    } as AppSettings;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const current = await this.getSettings();
    if (!current) return;

    const updated = { ...current, ...settings };
    await this.db.runAsync(
      'UPDATE settings SET ttsMode = ?, ttsVoice = ?, fontSize = ?, theme = ?, autoSync = ? WHERE id = ?',
      [updated.ttsMode, updated.ttsVoice, updated.fontSize, updated.theme, updated.autoSync ? 1 : 0, '1']
    );
  }
}

export const db = new DatabaseService();