"use client";

import { useState, useEffect, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface AiSummaryItem {
  title: string;
  description: string;
  url?: string;
}

export default function HomePage() {
  const [query, setQuery] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummaryContent, setAiSummaryContent] = useState<AiSummaryItem[] | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // Keep searchResults state, just don't render it
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false); // Track if a search has been initiated

  // Derived state to control results container visibility/animation
  // const relatedLinksAreVisible = searchResults && searchResults.length > 0; // Commented out - no longer needed for rendering the section
  const aiSummaryIsVisible = aiSummaryContent && aiSummaryContent.length > 0;


  useEffect(() => {
    let storedUserId = localStorage.getItem("shapeSearchUserId");
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("shapeSearchUserId", storedUserId);
    }
    setUserId(storedUserId);

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };

  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };


  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setAiSummaryContent(null);
    setSearchResults([]); // Keep clearing search results, but they won't be displayed
    setHasSearched(true); // Mark that a search has started

    try {
      let channelId = localStorage.getItem("shapeSearchChannelId");
      if (!channelId) {
        channelId = uuidv4();
        localStorage.setItem("shapeSearchChannelId", channelId);
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userId, channelId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const rawAiSummary = data.summary;
      let parsedSummaryItems: AiSummaryItem[] | null = null;

      if (rawAiSummary) {
        if (typeof rawAiSummary === "string") {
           try {
             const parsed = JSON.parse(rawAiSummary);
             // Check if the parsed result is a valid structure (array or object)
             if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && typeof item.title === 'string' && typeof item.description === 'string')) {
               parsedSummaryItems = parsed.map(item => ({
                 title: item.title,
                 description: item.description,
                 url: typeof item.url === 'string' ? item.url : undefined,
               }));
             } else if (typeof parsed === 'object' && parsed !== null && typeof parsed.title === 'string' && typeof parsed.description === 'string') {
               parsedSummaryItems = [{
                 title: parsed.title,
                 description: parsed.description,
                 url: typeof parsed.url === 'string' ? parsed.url : undefined,
               }];
             } else {
                // Parsed successfully, but not the expected array/object format
                console.warn("AI Summary string parsed to unexpected JSON format:", parsed);
                // Fallback: Treat as plain text if it seems like a simple string or just don't show it
                 if (typeof parsed === 'string') {
                     parsedSummaryItems = [{ title: "Summary", description: parsed }];
                 } else {
                     parsedSummaryItems = null; // Don't display unexpected parsed structure
                 }
             }
           } catch (e) {
             // JSON parsing failed for the string
             console.warn("AI Summary string failed JSON parsing, treating as plain text fallback:", rawAiSummary, e);
             // If parsing fails, treat the whole string as a single description
             parsedSummaryItems = [{
               title: "Summary", // Or null/undefined if you don't want a title for plain text
               description: rawAiSummary,
             }];
           }
        } else if (typeof rawAiSummary === 'object' && rawAiSummary !== null) {
           // rawAiSummary is already an object or array (assuming it's parsed JSON)
           if (Array.isArray(rawAiSummary) && rawAiSummary.every(item => typeof item === 'object' && item !== null && typeof item.title === 'string' && typeof item.description === 'string')) {
              parsedSummaryItems = rawAiSummary.map(item => ({
                title: item.title,
                description: item.description,
                url: typeof item.url === 'string' ? item.url : undefined,
              }));
           } else if (typeof rawAiSummary.title === 'string' && typeof rawAiSummary.description === 'string') {
              parsedSummaryItems = [{
                title: rawAiSummary.title,
                description: rawAiSummary.description,
                url: typeof rawAiSummary.url === 'string' ? rawAiSummary.url : undefined,
              }];
           } else {
              console.warn("AI Summary is in an unexpected non-string object format:", rawAiSummary);
               parsedSummaryItems = null; // Don't display unexpected object structure
           }
        } else {
           console.warn("AI Summary is in an unexpected non-string, non-object format:", rawAiSummary);
           parsedSummaryItems = null; // Don't display unexpected format
        }
      }

      setAiSummaryContent(parsedSummaryItems);
      setSearchResults(data.links || []); // Keep setting search results, but they won't be displayed

    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to fetch search results.");
      setAiSummaryContent(null); // Ensure summary is cleared on error
      setSearchResults([]); // Ensure links are cleared on error
    } finally {
      setIsLoading(false);
    }
  };

  const formatDisplayUrl = (url: string | undefined): string => {
    if (!url || typeof url !== 'string') {
      return 'Invalid URL';
    }
    try {
      const parsedUrl = new URL(url);
      let display = parsedUrl.hostname.replace(/^www\./, '');
      if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
        const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          const displayPathParts = pathParts.slice(0, 2);
          display += ' › ' + displayPathParts.join(' › ');
          if (pathParts.length > 2) {
            display += ' ...';
          }
        }
      }
      return display;
    } catch {
      return url;
    }
  };

  const truncateSnippet = (text: string, maxLength: number = 180): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, text.lastIndexOf(' ', maxLength));
    return truncated ? truncated + '...' : text.substring(0, maxLength) + '...';
  };


  // Condition to show the skeleton placeholder
  const showSkeleton = isLoading && hasSearched;


  return (
    <div className="container">
      <header className="header">
        <h1 className="app-title">Shape Search</h1>
        <button onClick={toggleDarkMode} className="theme-toggle" aria-label="Toggle dark mode">
          {isDarkMode ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
             </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2"></path>
                <path d="M12 21v2"></path>
                <path d="M4.22 4.22l1.42 1.42"></path>
                <path d="M18.36 18.36l1.42 1.42"></path>
                <path d="M1 12h2"></path>
                <path d="M21 12h2"></path>
                <path d="M4.22 19.78l1.42-1.42"></path>
                <path d="M18.36 5.64l1.42-1.42"></path>
             </svg>
          )}
        </button>
      </header>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-bar-wrapper">
           <input
             type="text"
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Ask Shape Search..."
             aria-label="Search query"
             className="search-input"
           />
           <button type="submit" disabled={isLoading} className="search-button">
             {isLoading ? (
                <span className="loading-spinner"></span>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                </svg>
             )}
              {/* {isLoading && <span className="loading-text">Searching...</span>} Removed text from button */}
           </button>
        </div>
      </form>

      {/* Loading/Error Messages - Keep these above results/skeleton */}
      <AnimatePresence mode="wait">
        {isLoading && !showSkeleton && ( // Only show text loading message before skeleton appears
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="info-message loading-message"
          >
             <span className="loading-spinner"></span> Searching for answers...
          </motion.div>
        )}
        {error && (
           <motion.div
             key="error"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="info-message error-message"
           >
             <span className="error-icon">!</span> Error: {error}
           </motion.div>
        )}
      </AnimatePresence>

       {/* Skeleton Placeholder - Shown when loading after first search */}
       <AnimatePresence mode="wait">
         {showSkeleton && (
           <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="skeleton-container"
           >
             {/* AI Summary Skeleton */}
             <div className="skeleton-ai-summary">
               <div className="skeleton-heading"></div> {/* Placeholder for AI Overview heading */}
               <div className="skeleton-item">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-description short"></div>
                  <div className="skeleton-source"></div>
               </div>
                <div className="skeleton-item">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-description short"></div>
                  <div className="skeleton-source"></div>
               </div>
             </div>

             {/* Related Links Skeleton - Commented out */}
             
             <div className="skeleton-related-links">
                <div className="skeleton-heading"></div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton-link-item">
                     <div className="skeleton-source"></div>
                     <div className="skeleton-title"></div>
                     <div className="skeleton-description"></div>
                     <div className="skeleton-description short"></div>
                  </div>
                ))}
             </div>
             
           </motion.div>
         )}
       </AnimatePresence>


      {/* AI Summary Section - Now its own animated section */}
      <AnimatePresence mode="wait">
        {aiSummaryIsVisible && (
          <motion.section
             key="ai-summary"
             className="ai-summary-container"
             aria-labelledby="ai-summary-heading"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.5 }}
          >
            <h2 id="ai-summary-heading" className="section-heading">AI Overview</h2>
            {aiSummaryContent.map((item, index) => (
               // Individual items already have animation from framer-motion map
               <article key={index} className="ai-summary-item">
                 {item.url ? (
                   <a href={item.url} target="_blank" rel="noopener noreferrer" className="ai-summary-title-link">
                     <h3 className="item-title">{item.title}</h3>
                   </a>
                 ) : (
                   <h3 className="item-title">{item.title}</h3>
                 )}
                 <p className="item-description">{item.description}</p>
                 {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="item-source-link">
                      {formatDisplayUrl(item.url)}
                    </a>
                 )}
               </article>
            ))}
          </motion.section>
        )}
      </AnimatePresence>


      {/* copyright section - Commented out */}
      {/*
      <AnimatePresence mode="wait">
        {relatedLinksAreVisible && (
           <motion.section
             key="related-links"
             className="results-container related-links-container" // Renamed results-container to be clearer, keep old class for styling
             aria-labelledby="related-links-heading"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             transition={{ duration: 0.5 }}
            >
              <h2 id="related-links-heading" className="section-heading">Copyright 2025, Shapes, Inc.</h2>
               {searchResults
                 .filter(result => result.link && typeof result.link === 'string')
                 .map((result, index) => (
                   // Individual items already have animation from framer-motion map
                   <article key={result.link || index} className="related-link-item">
                     <a href={result.link} target="_blank" rel="noopener noreferrer">
                       <span className="item-source-link">{formatDisplayUrl(result.link)}</span>
                       <h3 className="item-title link-title">{result.title}</h3>
                     </a>
                     <p className="item-description link-snippet">{truncateSnippet(result.snippet)}</p>
                   </article>
                 ))}
            </motion.section>
        )}
      </AnimatePresence>
      */}


      <footer className="app-footer">
         <p>
            Project Repo: <a href="https://github.com/kiyosh11/" target="_blank" rel="noopener noreferrer">GitHub</a>
         </p>
         <p>
            Created by: <a href="https://github.com/shapesinc/api" target="_blank" rel="noopener noreferrer">kiyoshi with shapes api.</a> {/* Replace with your actual link/name */}
         </p>
      </footer>

    </div>
  );
  }
