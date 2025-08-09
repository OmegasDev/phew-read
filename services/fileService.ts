import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export class FileService {
  static async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    return await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/epub+zip', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
  }

  static async scanDeviceForBooks(): Promise<string[]> {
    // In a real implementation, this would scan common directories
    // For now, return empty array as file system scanning is limited in Expo
    return [];
  }

  static async copyToAppDirectory(uri: string, filename: string): Promise<string> {
    const appDirectory = `${FileSystem.documentDirectory}books/`;
    await FileSystem.makeDirectoryAsync(appDirectory, { intermediates: true });
    
    const newPath = `${appDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });
    
    return newPath;
  }

  static async readTextFile(uri: string): Promise<string> {
    try {
      return await FileSystem.readAsStringAsync(uri);
    } catch (error) {
      console.error('Failed to read file:', error);
      return 'Unable to read file content. This may be a PDF or EPUB file that requires a native reader.';
    }
  }

  static async getFileInfo(uri: string): Promise<FileSystem.FileInfo> {
    return await FileSystem.getInfoAsync(uri);
  }

  static detectGenre(title: string, content?: string): string[] {
    const genres: string[] = [];
    const titleLower = title.toLowerCase();
    const contentLower = content?.toLowerCase() || '';
    
    const genreKeywords = {
      finance: ['finance', 'money', 'investment', 'wealth', 'trading', 'economics', 'business'],
      business: ['business', 'entrepreneur', 'management', 'leadership', 'startup', 'strategy'],
      technical: ['programming', 'code', 'development', 'software', 'computer', 'tech', 'algorithm'],
      fiction: ['novel', 'story', 'fiction', 'tale', 'adventure', 'romance'],
      mystery: ['mystery', 'detective', 'crime', 'murder', 'thriller'],
      scifi: ['science fiction', 'sci-fi', 'space', 'future', 'robot', 'alien'],
      fantasy: ['fantasy', 'magic', 'wizard', 'dragon', 'kingdom'],
      biography: ['biography', 'memoir', 'life of', 'autobiography'],
      history: ['history', 'historical', 'war', 'ancient', 'civilization'],
      selfhelp: ['self help', 'self-help', 'improve', 'success', 'motivation', 'productivity'],
      health: ['health', 'fitness', 'diet', 'nutrition', 'wellness', 'medical'],
      philosophy: ['philosophy', 'wisdom', 'ethics', 'meaning', 'existence'],
    };

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => 
        titleLower.includes(keyword) || contentLower.includes(keyword)
      )) {
        genres.push(genre);
      }
    }

    return genres.length > 0 ? genres : ['general'];
  }

  static getFileTypeFromUri(uri: string): 'pdf' | 'epub' | 'txt' | 'doc' {
    const extension = uri.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'epub':
        return 'epub';
      case 'txt':
        return 'txt';
      case 'doc':
      case 'docx':
        return 'doc';
      default:
        return 'txt';
    }
  }

  static extractAuthorFromFilename(filename: string): string | undefined {
    // Try to extract author from common filename patterns
    const patterns = [
      /^(.+?)\s*-\s*(.+)$/, // "Author - Title"
      /^(.+?)\s*by\s*(.+)$/i, // "Title by Author"
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) {
        return match[2]?.trim() || match[1]?.trim();
      }
    }

    return undefined;
  }
}