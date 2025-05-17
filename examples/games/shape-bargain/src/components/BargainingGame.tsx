'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import useGameStore from '@/store/gameStore';
import useGameLogic from '@/hooks/useGameLogic';
import MessageComponent from './game/MessageComponent';
import MerchantShop from './game/MerchantShop';
import ChatInput from './game/ChatInput';
import MerchantDirectory from './game/MerchantDirectory';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CircleDot, ChevronRight, ChevronLeft, ArrowLeft } from 'lucide-react';

export default function BargainingGame() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [userScrolling, setUserScrolling] = useState(false);
  const [isDirectoryView, setIsDirectoryView] = useState(true);
  
  const {
    gold,
    inventory,
    selectedItem,
    inventoryItemToSell,
    isShopOpen,
    setIsShopOpen,
  } = useGameStore();

  const {
    isLoading,
    isTyping,
    displayedResponse,
    shouldAutoScroll,
    setShouldAutoScroll,
    handleSendMessage,
    handleSelectItem,
    handleSelectInventoryItem,
    handleMakeOffer,
    handleSellItem,
    hasNewItems,
    // Multi-merchant specific data and functions
    merchants,
    currentMerchantId,
    setCurrentMerchantId,
    currentMerchantItems,
    currentMerchantChatHistory
  } = useGameLogic();

  // Get the current merchant's configuration
  const currentMerchant = useMemo(() => 
    merchants.find(m => m.id === currentMerchantId) || merchants[0],
    [merchants, currentMerchantId]
  );

  // Filter messages once
  const filteredMessages = useMemo(() => {
    return currentMerchantChatHistory.filter((msg) => {
      if (msg.role === 'user') {
        return !msg.content.includes('When listing items for sale');
      }
      return msg.role === 'merchant';
    });
  }, [currentMerchantChatHistory]);

  // Helper to check if user is at the bottom of the scroll container
  const isAtBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;
    
    // Consider "at bottom" if within 50px of the actual bottom
    return scrollHeight - scrollPosition < 50;
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current || userScrolling) return;
    
    // Only scroll if force is true (new message) or the user was already at the bottom
    if (force || isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isScrolledToBottom, userScrolling]);

  // Force immediate scroll to bottom for streaming
  const forceScrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current || userScrolling) return;
    
    // Only auto-scroll during typing if user was already at the bottom
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isScrolledToBottom, userScrolling]);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = useCallback(() => {
    // Set userScrolling to true to prevent auto-scrolling during user interaction
    setUserScrolling(true);
    
    // Check if at bottom after a short delay to ensure it's a genuine position
    const atBottom = isAtBottom();
    
    // Only update if the state actually changed
    if (atBottom !== isScrolledToBottom) {
      setIsScrolledToBottom(atBottom);
      setShouldAutoScroll(atBottom);
    }
    
    // Clear user scrolling flag after a delay
    clearTimeout((window as any).scrollTimeout);
    (window as any).scrollTimeout = setTimeout(() => {
      setUserScrolling(false);
    }, 500);
  }, [isAtBottom, isScrolledToBottom, setShouldAutoScroll]);

  // Only update notification frequency when streaming characters
  useEffect(() => {
    if (isTyping && !userScrolling) {
      forceScrollToBottom();
    }
  }, [isTyping, forceScrollToBottom, userScrolling]);

  // Scroll to bottom when new messages arrive, not on every render
  useEffect(() => {
    // Don't auto-scroll while user is manually scrolling
    if (!userScrolling) {
      scrollToBottom(true);
    }
  }, [filteredMessages.length, scrollToBottom, userScrolling]);

  // Set up scroll event listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Use passive true to improve performance
    const handleScrollEvent = (e: Event) => {
      // Debounce the scroll event
      if ((window as any).scrollDebounce) {
        window.clearTimeout((window as any).scrollDebounce);
      }
      
      // Set a flag immediately to block auto-scrolling
      setUserScrolling(true);
      
      // Process scroll position after a short delay
      (window as any).scrollDebounce = window.setTimeout(() => {
        handleScroll();
      }, 50);
    };
    
    container.addEventListener('scroll', handleScrollEvent, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      // Clean up any pending timeouts
      if ((window as any).scrollDebounce) {
        window.clearTimeout((window as any).scrollDebounce);
      }
      if ((window as any).scrollTimeout) {
        window.clearTimeout((window as any).scrollTimeout);
      }
    };
  }, [handleScroll]);

  // Handle merchant selection
  const handleSelectMerchant = useCallback((merchantId: string) => {
    // First set the merchant ID, which will trigger the useEffect in useGameLogic
    setCurrentMerchantId(merchantId);
    
    // Then switch to the chat view
    setIsDirectoryView(false);
  }, [setCurrentMerchantId]);

  // Go back to directory view
  const handleBackToDirectory = useCallback(() => {
    setIsDirectoryView(true);
  }, []);

  return (
    <div>
      {/* Main Content Area */}
      <Card className="p-4">
        <AnimatePresence mode="wait">
          {isDirectoryView ? (
            <motion.div
              key="directory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              <MerchantDirectory 
                merchants={merchants}
                onSelectMerchant={handleSelectMerchant}
                gold={gold}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              <div className="flex items-center space-x-4 mb-4">
                {/* Back button and Merchant info */}
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleBackToDirectory}
                    disabled={isLoading}
                    className="mr-2"
                    aria-label="Back to merchant directory"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <Avatar className="w-12 h-12">
                    <Image 
                      src={currentMerchant.avatar || "/merchant.png"} 
                      alt={currentMerchant.name} 
                      width={48} 
                      height={48} 
                    />
                  </Avatar>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-main">{currentMerchant.name}</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-secondary"
                        onClick={() => handleSendMessage('!wack')}
                        disabled={isLoading}
                      >
                        Restart
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                ref={messagesContainerRef}
                className="max-h-[70vh] min-h-[300px] overflow-y-auto pr-3 pb-2 rounded-xl max-w-[450px]"
                style={{ height: 'auto', minHeight: '300px' }}
              >
                {filteredMessages.length > 0 ? (
                  <>
                    {filteredMessages.map((msg, index) => (
                      <MessageComponent
                        key={`${currentMerchantId}-${index}`}
                        msg={msg}
                        isTyping={isTyping && index === filteredMessages.length - 1}
                        displayedResponse={displayedResponse}
                        index={index}
                        messagesLength={filteredMessages.length}
                        onCharacterStreamed={
                          // Only provide scroll callback for the last message when typing
                          index === filteredMessages.length - 1 && isTyping && shouldAutoScroll && !userScrolling
                            ? forceScrollToBottom
                            : undefined
                        }
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="hidden">
                    <p className="mb-4 font-secondary">Try asking the merchant something:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "Tell me about yourself",
                        "What items do you have today?", 
                        "Where are you from?",
                        "Show me your rarest items"
                      ].map((suggestion, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm" 
                          className="font-secondary"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isLoading && !isTyping && (
                  <div className="bg-gray-100 mr-8 p-2 rounded-xl inline-block">
                    <div className="flex gap-1 items-center px-2 pt-1">
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <ChatInput
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  messagesCount={filteredMessages.length}
                />
                <div className="relative">
                  <motion.div
                    animate={hasNewItems ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg"
                      onClick={() => setIsShopOpen(!isShopOpen)}
                      aria-label="Toggle merchant's wares menu"
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </Button>
                  </motion.div>
                  <AnimatePresence>
                    {hasNewItems && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1"
                      >
                        <CircleDot className="h-3 w-3 text-primary fill-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <MerchantShop
        gold={gold}
        discoveredItems={currentMerchantItems}
        inventory={inventory}
        selectedItem={selectedItem}
        inventoryItemToSell={inventoryItemToSell}
        onSelectItem={handleSelectItem}
        onSelectInventoryItem={handleSelectInventoryItem}
        onMakeOffer={handleMakeOffer}
        onSellItem={handleSellItem}
        isOpen={isShopOpen}
        onToggle={() => setIsShopOpen(false)}
        merchantName={currentMerchant.name}
      />
    </div>
  );
} 