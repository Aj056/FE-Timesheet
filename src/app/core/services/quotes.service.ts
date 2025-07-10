import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

/**
 * QuotesService - Handles fetching and managing inspirational quotes
 * 
 * Primary API: https://api.realinspire.live/v1/quotes/random?limit=1
 * Fallback APIs: quotable.io, zenquotes.io
 * Local fallback: Array of hardcoded motivational quotes
 * 
 * Features:
 * - Real-time quote fetching with API prioritization
 * - Automatic fallback handling on API failures
 * - Local quote rotation when all APIs fail
 * - Quote sharing functionality
 * - Loading state management
 */

export interface Quote {
  content: string;
  author: string;
  id?: number;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuotesService {
  private currentQuoteSubject = new BehaviorSubject<Quote | null>(null);
  public currentQuote$ = this.currentQuoteSubject.asObservable();

  // Fallback quotes - these will be used if API fails
  private readonly FALLBACK_QUOTES: Quote[] = [
    {
      content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      author: "Winston Churchill",
      category: "motivation"
    },
    {
      content: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
      category: "action"
    },
    {
      content: "Innovation distinguishes between a leader and a follower.",
      author: "Steve Jobs",
      category: "innovation"
    },
    {
      content: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "dreams"
    },
    {
      content: "It is during our darkest moments that we must focus to see the light.",
      author: "Aristotle",
      category: "perseverance"
    },
    {
      content: "Success is not how high you have climbed, but how you make a positive difference to the world.",
      author: "Roy T. Bennett",
      category: "success"
    },
    {
      content: "The only impossible journey is the one you never begin.",
      author: "Tony Robbins",
      category: "beginning"
    },
    {
      content: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
      category: "opportunity"
    },
    {
      content: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
      category: "belief"
    },
    {
      content: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "passion"
    },
    {
      content: "Time is your most valuable asset - use it wisely.",
      author: "Time Management Wisdom",
      category: "time"
    },
    {
      content: "Progress, not perfection, is the goal.",
      author: "Productivity Principles",
      category: "progress"
    }
  ];

  private currentQuoteIndex = 0;
  private isUsingFallback = false;

  // Primary quote API endpoint
  private readonly PRIMARY_QUOTE_API = 'https://api.realinspire.live/v1/quotes/random?limit=1';
  
  // Fallback quote API endpoints
  private readonly FALLBACK_QUOTE_APIS = [
    'https://api.quotable.io/random?tags=motivational,inspirational',
    'https://zenquotes.io/api/random'
  ];

  constructor(private http: HttpClient) {
    this.initializeQuotes();
  }

  private initializeQuotes(): void {
    // Start with a placeholder
    this.currentQuoteSubject.next({
      content: "Loading inspirational quote...",
      author: "Please wait",
      category: "loading"
    });
    
    // Try to fetch from API immediately
    this.fetchQuoteFromAPI().subscribe({
      next: (quote) => {
        // API quote loaded successfully
        console.log('Quote loaded from API:', quote);
      },
      error: (error) => {
        console.warn('Failed to load quote from APIs, using fallback:', error);
        // Only use fallback if API completely fails
        this.getNextFallbackQuote().subscribe();
      }
    });
  }

  public getRandomQuote(): Observable<Quote> {
    // First try API, then fallback
    return this.fetchQuoteFromAPI().pipe(
      catchError(() => this.getNextFallbackQuote())
    );
  }

  private fetchQuoteFromAPI(): Observable<Quote> {
    // Try realinspire.live API first (primary)
    return this.http.get<any>(this.PRIMARY_QUOTE_API)
      .pipe(
        timeout(5000),
        map(response => {
          console.log('API Response:', response); // Debug log
          
          // Handle realinspire.live API response format
          let quoteData = response;
          if (Array.isArray(response) && response.length > 0) {
            quoteData = response[0];
          }
          
          // Ensure we have valid quote data
          if (!quoteData || (!quoteData.content && !quoteData.text && !quoteData.quote)) {
            throw new Error('Invalid quote data from API');
          }
          
          const quote: Quote = {
            content: quoteData.content || quoteData.text || quoteData.quote || '',
            author: quoteData.author || quoteData.by || 'Unknown',
            id: quoteData.id || quoteData._id || Math.random().toString(36).substr(2, 9),
            category: quoteData.category || (quoteData.tags && quoteData.tags[0]) || 'motivation'
          };
          
          // Only proceed if we have valid content
          if (quote.content.trim()) {
            this.isUsingFallback = false;
            this.currentQuoteSubject.next(quote);
            return quote;
          } else {
            throw new Error('Empty quote content');
          }
        }),
        catchError(() => {
          // If primary API fails, try quotable.io fallback
          return this.http.get<any>(this.FALLBACK_QUOTE_APIS[0])
            .pipe(
              timeout(3000),
              map(response => {
                const quote: Quote = {
                  content: response.content,
                  author: response.author,
                  id: response._id,
                  category: response.tags?.[0] || 'motivation'
                };
                this.isUsingFallback = false;
                this.currentQuoteSubject.next(quote);
                return quote;
              }),
              catchError(() => {
                // If quotable.io fails, try zenquotes fallback
                return this.http.get<any[]>(this.FALLBACK_QUOTE_APIS[1])
                  .pipe(
                    timeout(3000),
                    map(response => {
                      if (response && response.length > 0) {
                        const quote: Quote = {
                          content: response[0].q,
                          author: response[0].a,
                          category: 'motivation'
                        };
                        this.isUsingFallback = false;
                        this.currentQuoteSubject.next(quote);
                        return quote;
                      }
                      throw new Error('No quote data');
                    }),
                    catchError(() => this.getNextFallbackQuote())
                  );
              })
            );
        })
      );
  }

  private getNextFallbackQuote(): Observable<Quote> {
    this.isUsingFallback = true;
    this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.FALLBACK_QUOTES.length;
    const quote = this.FALLBACK_QUOTES[this.currentQuoteIndex];
    this.currentQuoteSubject.next(quote);
    return of(quote);
  }

  public refreshQuote(): Observable<Quote> {
    return this.getRandomQuote();
  }

  public getCurrentQuote(): Quote | null {
    return this.currentQuoteSubject.value;
  }

  public isUsingFallbackQuotes(): boolean {
    return this.isUsingFallback;
  }

  public getFallbackQuotes(): Quote[] {
    return [...this.FALLBACK_QUOTES];
  }

  public shareQuote(quote: Quote): string {
    return `"${quote.content}" - ${quote.author}`;
  }

  /**
   * Get the source of the current quote for debugging
   */
  public getQuoteSource(): string {
    if (this.isUsingFallback) {
      return 'Local Fallback';
    }
    return 'API';
  }

  /**
   * Force refresh from API (skip cache)
   */
  public forceRefreshFromAPI(): Observable<Quote> {
    return this.fetchQuoteFromAPI();
  }

  /**
   * Get debug information about the service state
   */
  public getDebugInfo(): any {
    return {
      isUsingFallback: this.isUsingFallback,
      currentQuoteIndex: this.currentQuoteIndex,
      currentQuote: this.getCurrentQuote(),
      quoteSource: this.getQuoteSource(),
      primaryAPI: this.PRIMARY_QUOTE_API,
      fallbackAPIs: this.FALLBACK_QUOTE_APIS
    };
  }
}
