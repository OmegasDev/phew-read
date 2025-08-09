import { db } from './database';
import { RecommendedBook } from '@/types/database';

export class RecommendationService {
  static async getRecommendations(): Promise<RecommendedBook[]> {
    try {
      // Analyze user's reading patterns
      const books = await db.getAllBooks();
      const genreFrequency = this.analyzeGenrePreferences(books);
      
      // Generate recommendations based on top genres
      const recommendations = await this.generateRecommendations(genreFrequency);
      
      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }

  private static analyzeGenrePreferences(books: any[]): Record<string, number> {
    const genreCount: Record<string, number> = {};
    
    books.forEach(book => {
      if (book.genreTags && Array.isArray(book.genreTags)) {
        book.genreTags.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    return genreCount;
  }

  private static async generateRecommendations(genreFrequency: Record<string, number>): Promise<RecommendedBook[]> {
    // Mock recommendation database - in production, this would be an API call
    const bookDatabase: Record<string, RecommendedBook[]> = {
      finance: [
        {
          id: 'fin-1',
          title: 'Rich Dad Poor Dad',
          author: 'Robert Kiyosaki',
          genre: 'Finance',
          rating: 4.7,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 12.99,
          affiliateUrl: 'https://amazon.com/dp/1612680194',
          description: 'A guide to financial literacy and building wealth through smart investments.',
          isAvailableInArchive: true,
        },
        {
          id: 'fin-2',
          title: 'The Intelligent Investor',
          author: 'Benjamin Graham',
          genre: 'Finance',
          rating: 4.8,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 15.99,
          affiliateUrl: 'https://amazon.com/dp/0060555661',
          description: 'The definitive book on value investing and market analysis.',
          isAvailableInArchive: true,
        },
      ],
      business: [
        {
          id: 'bus-1',
          title: 'Atomic Habits',
          author: 'James Clear',
          genre: 'Business',
          rating: 4.9,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 13.99,
          affiliateUrl: 'https://amazon.com/dp/0735211299',
          description: 'An easy way to build good habits and break bad ones.',
          isAvailableInArchive: true,
        },
        {
          id: 'bus-2',
          title: 'The Lean Startup',
          author: 'Eric Ries',
          genre: 'Business',
          rating: 4.5,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 14.99,
          affiliateUrl: 'https://amazon.com/dp/0307887898',
          description: 'How constant innovation creates radically successful businesses.',
          isAvailableInArchive: false,
        },
      ],
      fiction: [
        {
          id: 'fic-1',
          title: 'The Seven Husbands of Evelyn Hugo',
          author: 'Taylor Jenkins Reid',
          genre: 'Fiction',
          rating: 4.8,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 11.99,
          affiliateUrl: 'https://amazon.com/dp/1501161938',
          description: 'A captivating novel about a reclusive Hollywood icon.',
          isAvailableInArchive: true,
        },
      ],
      technical: [
        {
          id: 'tech-1',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          genre: 'Technical',
          rating: 4.7,
          coverUrl: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
          price: 24.99,
          affiliateUrl: 'https://amazon.com/dp/0132350884',
          description: 'A handbook of agile software craftsmanship.',
          isAvailableInArchive: true,
        },
      ],
    };

    // Get top 3 genres
    const topGenres = Object.entries(genreFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    const recommendations: RecommendedBook[] = [];
    
    // Add recommendations from top genres
    topGenres.forEach(genre => {
      const genreBooks = bookDatabase[genre] || [];
      recommendations.push(...genreBooks);
    });

    // Add some general recommendations if not enough
    if (recommendations.length < 6) {
      const allBooks = Object.values(bookDatabase).flat();
      const remaining = allBooks.filter(book => 
        !recommendations.some(rec => rec.id === book.id)
      ).slice(0, 6 - recommendations.length);
      recommendations.push(...remaining);
    }

    return recommendations.slice(0, 8);
  }

  static async trackBookInteraction(bookId: string, action: 'view' | 'purchase' | 'favorite'): Promise<void> {
    // Track user interactions for better recommendations
    // In production, this would update recommendation algorithms
    console.log(`Tracked ${action} for book ${bookId}`);
  }
}