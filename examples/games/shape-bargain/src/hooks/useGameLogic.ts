import { useState, useEffect, useCallback, useMemo } from 'react';
import useGameStore from '@/store/gameStore';
import { chatWithMerchant } from '@/lib/shapes-api';
import { type Item } from '@/store/gameStore';
import { MERCHANT_PROMPT, getInitializePrompt } from '@/lib/merchantPrompt';
import { DEFAULT_MERCHANT_ID } from '@/config/merchants';

// Cache for item parsing results to avoid redundant processing
const itemParsingCache = new Map<string, Item[]>();
// Cache for deal parsing results
const dealParsingCache = new Map<string, any>();
// Cache for UI action parsing results
const uiActionParsingCache = new Map<string, any[]>();

export default function useGameLogic() {
  const [isLoading, setIsLoading] = useState(false);
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [hasNewItems, setHasNewItems] = useState(false);
  const [lastParsedMessage, setLastParsedMessage] = useState('');

  const {
    gold,
    inventory,
    discoveredItems,
    selectedItem,
    inventoryItemToSell,
    messages,
    
    // Multi-merchant specific state
    merchants,
    currentMerchantId,
    merchantWares,
    merchantChatHistories,
    initializedMerchants,
    
    // Actions
    setGold,
    setSelectedItem,
    setInventoryItemToSell,
    setCurrentOffer,
    
    // Legacy actions
    addMessage,
    addDiscoveredItem,
    removeDiscoveredItem,
    
    // Multi-merchant specific actions
    setCurrentMerchantId,
    setMerchantInitialized,
    resetMerchantState,
    addItemToMerchantWares,
    removeItemFromMerchantWares,
    addMessageToMerchantHistory,
    clearMerchantChatHistory,
    
    // Inventory actions
    addToInventory,
    removeFromInventory,
    
    // Global actions
    resetGame,
    clearMessages,
  } = useGameStore();

  // Get current merchant's items
  const currentMerchantItems = useMemo(() => 
    merchantWares[currentMerchantId] || [], 
    [merchantWares, currentMerchantId]
  );

  // Get current merchant's chat history
  const currentMerchantChatHistory = useMemo(() => 
    merchantChatHistories[currentMerchantId] || [], 
    [merchantChatHistories, currentMerchantId]
  );

  // Parse merchant responses for items - memoized with caching
  const parseItemsFromResponse = useCallback((content: string) => {
    // Return cached result if we've already parsed this content
    if (itemParsingCache.has(content)) {
      return itemParsingCache.get(content) || [];
    }

    // Skip item parsing if this is a deal acceptance message
    if (content.includes('[DEAL ACCEPTED]') || content.includes('```deal') || content.match(/deal\s*\n\s*\{/)) {
      itemParsingCache.set(content, []);
      return [];
    }
    
    // Fast pre-check if there are likely any items at all
    const hasPotentialItems = /\((\d+)(?:\s*gold)?\)|\d+\s*gold/.test(content);
    if (!hasPotentialItems) {
      itemParsingCache.set(content, []);
      return [];
    }
    
    // Clean the input text by removing any AI instruction text and internal notes
    let cleanContent = content;
    // Remove content between --- markers (often used for AI instructions)
    cleanContent = cleanContent.replace(/---[\s\S]*?---/g, '');
    // Remove lines starting with common AI instruction markers
    cleanContent = cleanContent.replace(/^(Here's|I would|Certainly|This response|As Tenshi).*$/gm, '');
    
    const patterns = [
      // Standard bullet/dash pattern with more flexible price format: "- Item Name (123)" or "* Item Name (123)"
      /(?:^|\n|\r)[*-]\s*([^(]+?)\s*\((\d+)(?:\s*gold)?\)/gim,
      
      // Non-bullet format with parentheses: "Item Name (50 gold)"
      /(?:^|\n|\r)([^()\n\r*-][^()\n\r]+?)\s*\((\d+)(?:\s*gold)?\)/gim,
      
      // Alternative format that might appear: "Item Name - 100 gold" or "Item Name: 100 gold"
      /(?:^|\n|\r)([^\-:\n\r]+?)\s*[-–:]\s*(\d+)\s*gold/gim,
      
      // Items mentioned with price: "the Item Name (costs 100 gold)" or similar variations
      /\b(?:the|a|an)\s+([^()\n\r,]{3,30}?)\s*(?:\((?:costs?|worth|priced at|sells for)\s+)?(\d+)\s*gold/gi,
      
      // Direct format: "Item Name (100 gold)" without bullet/dash
      /^([^(]+?)\s*\((\d+)\s*gold\)/gim,
      
      // Price first format: "(100 gold) Item Name"
      /\((\d+)\s*gold\)\s*([^(\n\r]+?)(?=\n|$|\()/gim
    ];
    
    // Use a Map for faster duplicate checking based on lowercase names
    const itemsMap = new Map<string, { name: string, basePrice: number, id: string }>();
    
    // Try primary pattern first (most common format)
    const primaryMatches = Array.from(cleanContent.matchAll(patterns[0]));

    if (primaryMatches.length > 0) {
      // Process items from primary pattern
      primaryMatches.forEach(match => {
        const name = match[1];
        const priceStr = match[2];
        
        if (name && priceStr) {
          const cleanName = name.trim();
          const price = parseInt(priceStr, 10);
          
          if (cleanName && !isNaN(price) && cleanName.length > 2 && price > 0) {
            const lowercaseName = cleanName.toLowerCase();
            if (!itemsMap.has(lowercaseName)) {
              itemsMap.set(lowercaseName, {
                id: lowercaseName.replace(/\s+/g, '-'),
                name: cleanName,
                basePrice: price
              });
            }
          }
        }
      });
    } 
    
    // If primary pattern didn't yield results, try all patterns
    if (itemsMap.size === 0) {
      // Try all patterns
      for (let i = 0; i < patterns.length; i++) {
        const matches = Array.from(cleanContent.matchAll(patterns[i]));
        
        matches.forEach(match => {
          // Handle price-first format (pattern at index 5) differently
          const isPriceFirstPattern = i === 5;
          const [name, priceStr] = isPriceFirstPattern ? [match[2], match[1]] : [match[1], match[2]];
          
          if (name && priceStr) {
            const cleanName = name.trim();
            const price = parseInt(priceStr, 10);
            
            if (cleanName && !isNaN(price) && cleanName.length > 2 && price > 0) {
              const lowercaseName = cleanName.toLowerCase();
              if (!itemsMap.has(lowercaseName)) {
                itemsMap.set(lowercaseName, {
                  id: lowercaseName.replace(/\s+/g, '-'),
                  name: cleanName,
                  basePrice: price
                });
              }
            }
          }
        });
      }
    }
    
    // Convert Map to array of unique items
    const uniqueItems = Array.from(itemsMap.values());
    
    // Cache the result
    itemParsingCache.set(content, uniqueItems);
    
    return uniqueItems;
  }, []);

  // Parse deal blocks from merchant responses - memoized with caching
  const parseDealFromResponse = useCallback((content: string) => {
    // Return cached result if we've already parsed this content
    if (dealParsingCache.has(content)) {
      return dealParsingCache.get(content);
    }
    
    // Fast check if content likely contains a deal block before running regex
    if (!content.includes('deal') && !content.includes('items:') && !content.includes('status:') && !content.includes('[DEAL ACCEPTED]')) {
      dealParsingCache.set(content, null);
      return null;
    }

    try {
      // Remove meta-instructions or anything outside the relevant content
      // This helps when AIs add instruction text or explanations
      let cleanedContent = content;
      // Remove lines that look like AI instructions or meta-commentary
      cleanedContent = cleanedContent.replace(/^(Here's|I would|Certainly|This response).*$/gm, '');
      // Remove content between triple dashes (often used to separate AI instructions)
      cleanedContent = cleanedContent.replace(/---[\s\S]*?---/g, '');
      
      // Try several pattern formats for deal blocks in order of most likely
      
      // 1. First look for ```deal {...} ``` format
      const dealBlockMatch = cleanedContent.match(/```(?:deal)?\s*([\s\S]*?)```/i);
      
      // 2. If not found, look for "deal\n{...}" format (without backticks)
      const simpleDealMatch = !dealBlockMatch ? cleanedContent.match(/deal\s*\n\s*(\{[\s\S]*?\})/i) : null;
      
      // 3. Direct JSON format with items array
      const jsonMatch = (!dealBlockMatch && !simpleDealMatch) ? 
                         cleanedContent.match(/\{[\s\S]*?"items"[\s\S]*?\}/i) : null;
      
      // Which format was matched?
      const dealText = dealBlockMatch ? dealBlockMatch[1].trim() :
                       simpleDealMatch ? simpleDealMatch[1].trim() :
                       jsonMatch ? jsonMatch[0].trim() : null;
      
      // Check if the message contains deal status indicators
      const hasDealAcceptedIndicator = cleanedContent.includes('[DEAL ACCEPTED]');
      const hasDealRejectedIndicator = cleanedContent.includes('[NO DEAL]');
      
      // If no deal text was found but there's a deal acceptance indicator,
      // try to extract information directly from the message text
      if (!dealText && hasDealAcceptedIndicator) {
        // Try to detect item name and price from the text
        const itemMatch = cleanedContent.match(/([A-Za-z\s]+(?:Key|Pearl|Mirror|Stone|Amulet|Cloak|Locket|Dust|Chains|Orb))\s+(?:is|for)\s+(\d+)\s+gold/i);
        
        if (itemMatch) {
          const itemName = itemMatch[1].trim();
          const price = parseInt(itemMatch[2], 10);
          
          // Create a synthetic deal object
          const result = {
            multiItem: true,
            items: [{
              name: itemName,
              quantity: 1,
              price: price
            }],
            status: 'accepted',
            seller: cleanedContent.toLowerCase().includes('sell') ? 'player' : 'merchant'
          };
          
          // Cache the result
          dealParsingCache.set(content, result);
          return result;
        }
      }
      
      if (!dealText) {
        dealParsingCache.set(content, null);
        return null;
      }
      
      // First clean out any comments from the JSON
      const commentRegex = /\/\/.*$/gm;
      let cleanDealText = dealText.replace(commentRegex, '');
      
      // Try to parse the JSON with some flexibility
      cleanDealText = cleanDealText
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // Add quotes to keys IF UNQUOTED and after { or ,
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
      
      // Try to extract the items array and other properties
      let parsedDeal;
      try {
        parsedDeal = JSON.parse(cleanDealText);
      } catch (e) {
        console.log("[parseDealFromResponse] Failed to parse JSON:", e);
        console.log("[parseDealFromResponse] Attempted to parse:", cleanDealText);
        
        // Try to extract just the items array if available
        const itemsMatch = cleanDealText.match(/"items":\s*(\[[\s\S]*?\])/);
        const statusMatch = cleanDealText.match(/"status":\s*"([^"]+)"/);
        const sellerMatch = cleanDealText.match(/"seller":\s*"([^"]+)"/);
        
        let items = [];
        if (itemsMatch) {
          try {
            items = JSON.parse(itemsMatch[1]);
          } catch (err) {
            console.log("[parseDealFromResponse] Failed to parse items array:", err);
            
            // Try even more aggressive parsing - extract just name/price pairs from items section
            const nameMatch = cleanDealText.match(/"name":\s*"([^"]+)"/);
            const priceMatch = cleanDealText.match(/"price":\s*(\d+)/);
            const quantityMatch = cleanDealText.match(/"quantity":\s*(\d+)/);
            
            if (nameMatch && priceMatch) {
              items = [{
                name: nameMatch[1],
                quantity: quantityMatch ? parseInt(quantityMatch[1], 10) : 1,
                price: parseInt(priceMatch[1], 10)
              }];
            } else {
              items = [];
            }
          }
        } else {
          // Manually check for item objects in the text
          const itemPattern = /"name":\s*"([^"]+)"[\s\S]*?"quantity":\s*(\d+)[\s\S]*?"price":\s*(\d+)/g;
          const itemMatches = Array.from(cleanDealText.matchAll(itemPattern));
          
          items = itemMatches.map(match => ({
            name: match[1],
            quantity: parseInt(match[2], 10),
            price: parseInt(match[3], 10)
          }));
          
          // If that didn't find anything, try a more relaxed pattern
          if (items.length === 0) {
            const relaxedItemPattern = /"name":\s*"([^"]+)"[\s\S]*?"price":\s*(\d+)/g;
            const relaxedMatches = Array.from(cleanDealText.matchAll(relaxedItemPattern));
            
            items = relaxedMatches.map(match => ({
              name: match[1],
              quantity: 1,
              price: parseInt(match[2], 10)
            }));
          }
        }
        
        parsedDeal = {
          items: items,
          status: statusMatch ? statusMatch[1] : 'pending',
          seller: sellerMatch ? sellerMatch[1] : 'merchant'
        };
      }
      
      // Determine status based on both JSON and text indicators
      let status = parsedDeal.status || 'pending';
      
      if (hasDealAcceptedIndicator) {
        status = 'accepted';
      } else if (hasDealRejectedIndicator) {
        status = 'rejected';
      }
      
      // Normalize item names - convert them to proper case and remove extra spaces
      if (Array.isArray(parsedDeal.items)) {
        parsedDeal.items = parsedDeal.items.map((item: any) => {
          if (typeof item.name === 'string') {
            // Convert first letter of each word to uppercase, others to lowercase
            item.name = item.name.replace(/\b\w+/g, (word: string) => 
              word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
            ).trim();
          }
          return item;
        });
      }
      
      const result = {
        multiItem: true,
        items: Array.isArray(parsedDeal.items) ? parsedDeal.items.map((item: any) => ({
          name: item.name || '',
          quantity: item.quantity || 1,
          price: item.price || 0
        })) : [],
        status: status,
        seller: parsedDeal.seller || 'merchant'
      };
      
      // Cache the result
      dealParsingCache.set(content, result);
      return result;
    } catch (error) {
      console.log("[parseDealFromResponse] Error parsing deal:", error);
      dealParsingCache.set(content, null);
      return null;
    }
  }, []);

  // Parse UI actions from merchant responses
  const parseUIActionsFromResponse = useCallback((content: string) => {
    // Return cached result if we've already parsed this content
    if (uiActionParsingCache.has(content)) {
      return uiActionParsingCache.get(content) || [];
    }

    // Fast check if content likely contains a UI action
    if (!content.includes('ui_action')) {
      uiActionParsingCache.set(content, []);
      return [];
    }
    
    // Clean the input text by removing any AI instruction text and internal notes
    let cleanContent = content;
    // Remove content between --- markers (often used for AI instructions)
    cleanContent = cleanContent.replace(/---[\s\S]*?---/g, '');
    // Remove lines starting with common AI instruction markers
    cleanContent = cleanContent.replace(/^(Here's|I would|Certainly|This response|As Tenshi).*$/gm, '');
    
    const actions: Array<{ui_action: string, [key: string]: any}> = [];
    
    // Match full JSON objects that contain "ui_action"
    const uiActionMatches = cleanContent.match(/\{[^{}]*"ui_action"[^{}]*\}/g) || 
                           cleanContent.match(/\{[^{}]*ui_action[^{}]*\}/g);
    
    if (uiActionMatches) {
      for (const jsonText of uiActionMatches) {
        try {
          // Try to parse the JSON object
          const cleanedJson = jsonText
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/(\w+):/g, '"$1":'); // Add quotes to keys
          
          const jsonObject = JSON.parse(cleanedJson);
          
          // Validate it has ui_action property
          if (jsonObject.ui_action) {
            actions.push(jsonObject);
          }
        } catch (err) {
          console.log('[parseUIActionsFromResponse] Failed to parse UI action:', jsonText, err);
          
          // Attempt more aggressive parsing with regex
          try {
            const actionTypeMatch = jsonText.match(/ui_action"?\s*:\s*"?([^",\s}]+)/i);
            if (actionTypeMatch) {
              const action: {ui_action: string, open?: boolean, itemId?: string} = { 
                ui_action: actionTypeMatch[1]
              };
              
              // Try to extract other common properties
              const openMatch = jsonText.match(/open"?\s*:\s*(\w+)/i);
              if (openMatch) {
                action.open = openMatch[1].toLowerCase() === 'true';
              }
              
              const itemIdMatch = jsonText.match(/itemId"?\s*:\s*"?([^",\s}]+)/i);
              if (itemIdMatch) {
                action.itemId = itemIdMatch[1];
              }
              
              actions.push(action);
            }
          } catch (fallbackErr) {
            // Silent fail for invalid JSON after fallback attempt
          }
        }
      }
    }
    
    // Cache the result
    uiActionParsingCache.set(content, actions);
    
    return actions;
  }, []);

  // Handle UI actions from merchant responses
  const handleUIActions = useCallback((actions: any[]) => {
    if (!actions || actions.length === 0) return;
    
    // Sort actions so toggle_shop comes before focus_item
    const sortedActions = [...actions].sort((a, b) => {
      // Make shop toggles happen first
      if (a.ui_action === 'toggle_shop' && b.ui_action !== 'toggle_shop') return -1;
      if (b.ui_action === 'toggle_shop' && a.ui_action !== 'toggle_shop') return 1;
      return 0;
    });
    
    // Process each action with a slight delay for better UI response
    sortedActions.forEach((action, index) => {
      // Stagger actions slightly for better animation flow
      setTimeout(() => {
        switch (action.ui_action) {
          case 'toggle_shop':
            // Toggle the shop UI
            if (typeof action.open === 'boolean') {
              useGameStore.getState().setIsShopOpen(action.open);
              
              // If we're closing the shop, also clear selection
              if (!action.open) {
                setSelectedItem(null);
              }
            }
            break;
            
          case 'focus_item':
            // Focus on a specific item in the shop
            if (action.itemId) {
              // First make sure shop is open
              useGameStore.getState().setIsShopOpen(true);
              
              // Find the item by ID and select it
              // Try exact match first
              let itemToFocus = currentMerchantItems.find(item => item.id === action.itemId);
              
              // If not found, try a fuzzy match (item ID might have slight differences)
              if (!itemToFocus) {
                const normalizedItemId = action.itemId.toLowerCase().replace(/[^a-z0-9]/g, '-');
                
                itemToFocus = currentMerchantItems.find(item => {
                  const normalizedId = item.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  return normalizedId === normalizedItemId || 
                         normalizedId.includes(normalizedItemId) || 
                         normalizedItemId.includes(normalizedId);
                });
              }
              
              // If still not found, try matching by name
              if (!itemToFocus) {
                // Convert the itemId back to a potential name
                const possibleName = action.itemId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                
                itemToFocus = currentMerchantItems.find(item => {
                  return item.name.toLowerCase().includes(possibleName.toLowerCase()) ||
                         possibleName.toLowerCase().includes(item.name.toLowerCase());
                });
              }
              
              if (itemToFocus) {
                setSelectedItem(itemToFocus);
                setCurrentOffer(itemToFocus.basePrice);
                setInventoryItemToSell(null); // Clear any selling items
              }
            }
            break;
        }
      }, index * 100); // Stagger actions by 100ms
    });
  }, [currentMerchantItems, setCurrentOffer, setSelectedItem, setInventoryItemToSell]);

  // Initialize a merchant if they haven't been initialized yet
  const initializeMerchant = useCallback(async (merchantId: string) => {
    if (initializedMerchants[merchantId]) {
      console.log(`[initializeMerchant] Merchant ${merchantId} already initialized, skipping.`);
      return;
    }
    
    console.log(`[initializeMerchant] Starting initialization for merchant ${merchantId}`);
    setIsLoading(true);
    
    try {
      // Send !reset command
      await chatWithMerchant(
        '!reset',
        {
          gold,
          inventory,
          merchantItems: merchantWares[merchantId] || []
        },
        merchantId
      );
      
      // Send !wack command
      await chatWithMerchant(
        '!wack',
        {
          gold,
          inventory,
          merchantItems: merchantWares[merchantId] || []
        },
        merchantId
      );
      
      // Send the merchant prompt and initialization prompt
      console.log(`[initializeMerchant] Sending initial merchant prompt to ${merchantId}`);
      
      // Send the initialization prompt
      const response = await chatWithMerchant(
        getInitializePrompt(merchantId),
        {
          gold,
          inventory,
          merchantItems: merchantWares[merchantId] || []
        },
        merchantId
      );
      
      if (response.success) {
        console.log(`[initializeMerchant] Received initial response from ${merchantId}`);
        
        // Add to merchant-specific chat history
        addMessageToMerchantHistory(merchantId, { 
          role: 'merchant', 
          content: response.message 
        });
        
        // Set displayed response if this is the current merchant
        if (merchantId === currentMerchantId) {
          setDisplayedResponse('');
          setIsTyping(true);
        }
        
        // Mark merchant as initialized
        setMerchantInitialized(merchantId);
      } else {
        // Handle error response
        console.error(`[initializeMerchant] Unsuccessful response from ${merchantId}:`, response);
        
        // Add fallback greeting
        const fallbackMessage = "Greetings traveler! Welcome to my humble shop. How may I assist you today?";
        addMessageToMerchantHistory(merchantId, { 
          role: 'merchant', 
          content: fallbackMessage 
        });
        
        // Set displayed response if this is the current merchant
        if (merchantId === currentMerchantId) {
          setDisplayedResponse('');
          setIsTyping(true);
        }
        
        // Still mark as initialized to avoid retry loop
        setMerchantInitialized(merchantId);
      }
    } catch (error) {
      console.error(`[initializeMerchant] Error initializing merchant ${merchantId}:`, error);
      
      // Add fallback message
      const fallbackMessage = "Greetings traveler! Welcome to my humble shop. How may I assist you today?";
      addMessageToMerchantHistory(merchantId, { 
        role: 'merchant', 
        content: fallbackMessage 
      });
      
      // Set displayed response if this is the current merchant
      if (merchantId === currentMerchantId) {
        setDisplayedResponse('');
        setIsTyping(true);
      }
      
      // Mark as initialized to avoid retry loop
      setMerchantInitialized(merchantId);
    } finally {
      setIsLoading(false);
    }
  }, [
    gold, 
    inventory, 
    initializedMerchants, 
    merchantWares, 
    currentMerchantId, 
    addMessageToMerchantHistory, 
    setMerchantInitialized
  ]);

  const handleSendMessage = async (currentMessage: string): Promise<void> => {
    if (!currentMessage.trim() || isLoading) return Promise.resolve();

    setIsLoading(true);
    setIsTyping(false);
    setDisplayedResponse('');
    setSelectedItem(null); // Clear selected item when sending a message
    setInventoryItemToSell(null); // Clear inventory item to sell when sending a message
    setCurrentOffer(0); // Reset the current offer

    // Handle special commands
    if (currentMessage === '!wack') {
      // Reset only the current merchant
      resetMerchantState(currentMerchantId);
      clearMerchantChatHistory(currentMerchantId);
      
      // Initialize this merchant again
      await initializeMerchant(currentMerchantId);
      
      setIsLoading(false);
      return Promise.resolve();
    }
    
    // Support switching merchants through chat command
    if (currentMessage.startsWith('!switchmerchant ')) {
      const targetMerchantId = currentMessage.split(' ')[1]?.trim();
      const merchantExists = merchants.some(m => m.id === targetMerchantId);
      
      if (merchantExists) {
        setCurrentMerchantId(targetMerchantId);
        
        // Initialize the merchant if needed
        if (!initializedMerchants[targetMerchantId]) {
          await initializeMerchant(targetMerchantId);
        }
        
        setIsLoading(false);
        return Promise.resolve();
      } else {
        // Notify user of invalid merchant
        addMessageToMerchantHistory(currentMerchantId, { 
          role: 'merchant', 
          content: `**[System] Merchant "${targetMerchantId}" not found.**` 
        });
        setIsLoading(false);
        return Promise.resolve();
      }
    }

    // Add user message to chat history if it's not a command
    if (!currentMessage.startsWith('!')) {
      addMessageToMerchantHistory(currentMerchantId, { 
        role: 'user', 
        content: currentMessage 
      });
    }

    try {
      const response = await chatWithMerchant(
        currentMessage,
        {
          gold,
          inventory,
          merchantItems: merchantWares[currentMerchantId] || []
        },
        currentMerchantId
      );

      if (response.success) {
        if (!currentMessage.startsWith('!') || currentMessage === '!start') {
          // Normalize line breaks to handle potential inconsistencies
          const normalizedMessage = response.message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          let finalMessageContent = normalizedMessage; // Initialize with the base message
          
          // Process the message in a consistent order to avoid multiple passes
          
          // 1. Parse and handle UI actions first
          const uiActions = parseUIActionsFromResponse(normalizedMessage);
          if (uiActions.length > 0) {
            handleUIActions(uiActions);
          }
          
          // 2. Handle deal response if present
          const dealResponse = parseDealFromResponse(normalizedMessage);
          
          if (dealResponse) {
            let dealStatusMarker = '';
            if (dealResponse.status === 'accepted' || (dealResponse.status === 'pending' && response.message.includes('[DEAL ACCEPTED]'))) {
              dealStatusMarker = `\n\n<!-- DEAL_STATUS: accepted -->`;
              
              if (dealResponse.seller === 'player') {
                // When the player is the seller (player sells to merchant)
                handleChatSellTransaction(dealResponse);
              } else {
                // When the merchant is the seller (player buys from merchant)
                handleChatBuyTransaction(dealResponse);
              }
            } else if (dealResponse.status === 'rejected') {
              dealStatusMarker = `\n\n<!-- DEAL_STATUS: rejected -->`;
            } else {
              dealStatusMarker = `\n\n<!-- DEAL_STATUS: pending -->`;
            }
            
            finalMessageContent += dealStatusMarker; // Append the deal status marker
          }

          // 3. Add merchant response to chat history
          addMessageToMerchantHistory(currentMerchantId, { 
            role: 'merchant', 
            content: finalMessageContent
          });
          
          setIsTyping(true);
          setLastParsedMessage(finalMessageContent);
          
          // 4. Parse items last, after everything else is processed
          // Only do this if there was no deal (deals already handle item transfers)
          if (!dealResponse) {
            const newItems = parseItemsFromResponse(normalizedMessage);
            
            if (newItems.length > 0) {
              setHasNewItems(true);
              // Reset notification after 3 seconds
              setTimeout(() => setHasNewItems(false), 3000);
              
              // Add items to current merchant's wares
              newItems.forEach(item => {
                addItemToMerchantWares(currentMerchantId, item);
                // Also update legacy state for compatibility
                addDiscoveredItem(item);
              });
            }
          }
        }
      } else {
        if (!currentMessage.startsWith('!')) {
          addMessageToMerchantHistory(currentMerchantId, {
            role: 'merchant',
            content: response.message || 'The merchant seems distracted...'
          });
        }
      }
    } catch (error) {
      if (!currentMessage.startsWith('!')) {
        addMessageToMerchantHistory(currentMerchantId, {
          role: 'merchant',
          content: 'The merchant seems distracted...'
        });
      }
    } finally {
      setIsLoading(false);
    }
    
    return Promise.resolve();
  };

  // Display feedback for transaction results
  const displayTransactionResult = useCallback((message: string, type: 'success' | 'error') => {
    // Add a system message to show what happened with the transaction
    const systemMessage = {
      role: 'merchant' as const,
      content: `*${type === 'success' ? '✅' : '❌'} ${message}*`
    };
    
    // Add to current merchant's chat history
    setTimeout(() => {
      addMessageToMerchantHistory(currentMerchantId, systemMessage);
    }, 500);
  }, [addMessageToMerchantHistory, currentMerchantId]);

  // Handle buy transaction negotiated through chat
  const handleChatBuyTransaction = useCallback((dealResponse: ReturnType<typeof parseDealFromResponse>) => {
    if (!dealResponse?.items?.length) return;
    
    // Process each item in the deal
    for (const itemDeal of dealResponse.items) {
      // Find the item in current merchant's wares by name (case-insensitive)
      const itemName = itemDeal.name.trim();
      const quantity = itemDeal.quantity || 1;
      const offerAmount = itemDeal.price || 0;
      
      // Check if this is a gold transfer rather than an actual item
      // (e.g., "500 gold" which should add 500 gold to the player rather than adding an item)
      const goldTransferMatch = itemName.match(/^(\d+)\s+gold$/i);
      if (goldTransferMatch) {
        const goldAmount = parseInt(goldTransferMatch[1], 10);
        if (!isNaN(goldAmount) && goldAmount > 0) {
          console.log(`[handleChatBuyTransaction] Detected gold transfer: +${goldAmount} gold`);
          
          // Add the gold to the player's balance instead of deducting it
          setGold(gold + goldAmount);
          
          // Display transaction feedback
          displayTransactionResult(`You received ${goldAmount} gold!`, 'success');
          
          // Skip the rest of the processing for this item
          continue;
        }
      }
      
      const foundItem = currentMerchantItems.find(
        item => item.name.toLowerCase() === itemName.toLowerCase()
      );

      // Check if player has enough gold for this transaction
      if (gold < offerAmount) {
        console.log('[handleChatBuyTransaction] Not enough gold for purchase');
        addMessageToMerchantHistory(currentMerchantId, {
          role: 'merchant',
          content: "You don't have enough gold!"
        });
        
        // Display transaction feedback
        displayTransactionResult(`Not enough gold to buy ${itemName}!`, 'error');
        return; // Exit early if not enough gold
      }

      if (foundItem) {
        console.log(`[handleChatBuyTransaction] Found matching item in ${currentMerchantId}'s wares:`, foundItem);
        
        // Process the purchase for the specified quantity
        console.log(`[handleChatBuyTransaction] Bought ${quantity}x "${foundItem.name}" from ${currentMerchantId} for ${offerAmount} gold`);
        setGold(gold - offerAmount);
        
        // Add items to inventory with correct quantity
        for (let i = 0; i < quantity; i++) {
          // Create a unique instanceId to avoid key collisions in inventory
          const itemWithInstanceId = {
            ...foundItem,
            instanceId: `${foundItem.id}-${Date.now()}-${i}`
          };
          addToInventory(itemWithInstanceId);
        }
        
        // Only remove the item from merchant wares if all were purchased
        // This is a simplification - a real implementation might reduce quantity instead
        if (quantity === 1) {
          removeItemFromMerchantWares(currentMerchantId, foundItem.id);
          // Also update legacy store for compatibility
          removeDiscoveredItem(foundItem.id);
        }
        
        setSelectedItem(null);
        
        // Display transaction feedback
        const quantityText = quantity > 1 ? `${quantity}x ` : '';
        displayTransactionResult(`You bought ${quantityText}${foundItem.name} for ${offerAmount} gold!`, 'success');
      } else {
        // If item not found in merchant's wares, create a new item on the fly
        console.log(`[handleChatBuyTransaction] Item "${itemName}" not in ${currentMerchantId}'s wares, creating new item`);
        
        // Create a new item based on the deal response
        const newItem = {
          id: itemName.toLowerCase().replace(/\s+/g, '-'),
          name: itemName,
          basePrice: Math.floor(offerAmount / quantity) // Calculate unit price
        };
        
        console.log(`[handleChatBuyTransaction] Created new item:`, newItem);
        console.log(`[handleChatBuyTransaction] Bought ${quantity}x "${newItem.name}" from ${currentMerchantId} for ${offerAmount} gold`);
        
        setGold(gold - offerAmount);
        
        // Add items to inventory with correct quantity
        for (let i = 0; i < quantity; i++) {
          // Create a unique instanceId to avoid key collisions
          const itemWithInstanceId = {
            ...newItem,
            instanceId: `${newItem.id}-${Date.now()}-${i}`
          };
          addToInventory(itemWithInstanceId);
        }
        
        setSelectedItem(null);
        
        // Display transaction feedback
        const quantityText = quantity > 1 ? `${quantity}x ` : '';
        displayTransactionResult(`You bought ${quantityText}${newItem.name} for ${offerAmount} gold!`, 'success');
      }
    }
  }, [
    addMessageToMerchantHistory, 
    addToInventory, 
    currentMerchantId, 
    currentMerchantItems,
    displayTransactionResult, 
    gold, 
    removeDiscoveredItem, 
    removeItemFromMerchantWares, 
    setGold, 
    setSelectedItem
  ]);

  // Handle sell transaction negotiated through chat
  const handleChatSellTransaction = useCallback((dealResponse: ReturnType<typeof parseDealFromResponse>) => {
    if (!dealResponse?.items?.length) return;
    
    // Process each item in the deal
    for (const itemDeal of dealResponse.items) {
      // Find the item in inventory by name (case-insensitive)
      const itemName = itemDeal.name.trim();
      const quantity = itemDeal.quantity || 1;
      const saleAmount = itemDeal.price || 0;
      
      // Check if this is a gold transfer rather than an actual item
      // (e.g., "500 gold" which would be a direct gold payment)
      const goldTransferMatch = itemName.match(/^(\d+)\s+gold$/i);
      if (goldTransferMatch) {
        const goldAmount = parseInt(goldTransferMatch[1], 10);
        if (!isNaN(goldAmount) && goldAmount > 0) {
          console.log(`[handleChatSellTransaction] Detected gold transfer: +${goldAmount} gold`);
          
          // Add the gold to the player's balance
          setGold(gold + saleAmount);
          
          // Display transaction feedback
          displayTransactionResult(`You received ${saleAmount} gold!`, 'success');
          
          // Skip the rest of the processing for this item
          continue;
        }
      }
      
      // Find matching items in inventory
      const matchingItems = inventory.filter(
        item => item.name.toLowerCase() === itemName.toLowerCase()
      );

      if (matchingItems.length >= quantity) {
        console.log(`[handleChatSellTransaction] Found ${matchingItems.length} matching items in inventory to sell to ${currentMerchantId}`);
        
        console.log(`[handleChatSellTransaction] Sold ${quantity}x "${itemName}" to ${currentMerchantId} for ${saleAmount} gold`);
        setGold(gold + saleAmount);
        
        // Remove the specified quantity from inventory
        // We remove specific instances to maintain uniqueness
        for (let i = 0; i < quantity; i++) {
          if (i < matchingItems.length) {
            removeFromInventory(matchingItems[i].id);
          }
        }
        
        setInventoryItemToSell(null);
        
        // Display transaction feedback
        const quantityText = quantity > 1 ? `${quantity}x ` : '';
        displayTransactionResult(`You sold ${quantityText}${itemName} for ${saleAmount} gold!`, 'success');
      } else {
        console.log(`[handleChatSellTransaction] Not enough "${itemName}" in inventory (have ${matchingItems.length}, need ${quantity}), transaction with ${currentMerchantId} canceled`);
        // Inform the player they don't have enough of this item
        displayTransactionResult(`You don't have enough ${itemName} in your inventory!`, 'error');
      }
    }
  }, [
    currentMerchantId,
    displayTransactionResult, 
    gold, 
    inventory, 
    removeFromInventory, 
    setGold, 
    setInventoryItemToSell
  ]);

  const handleSelectItem = useCallback((item: Item) => {
    console.log(`[handleSelectItem] Selected item from ${currentMerchantId}:`, item);
    setSelectedItem(item);
    setInventoryItemToSell(null);
    setCurrentOffer(item.basePrice);
  }, [currentMerchantId, setCurrentOffer, setInventoryItemToSell, setSelectedItem]);

  const handleSelectInventoryItem = useCallback((item: Item) => {
    console.log(`[handleSelectInventoryItem] Selected inventory item to sell to ${currentMerchantId}:`, item);
    setInventoryItemToSell(item);
    setSelectedItem(null);
    setCurrentOffer(item.basePrice);
  }, [currentMerchantId, setCurrentOffer, setInventoryItemToSell, setSelectedItem]);

  const handleMakeOffer = useCallback((amount: number) => {
    if (!selectedItem) return;
    console.log(`[handleMakeOffer] Making offer to ${currentMerchantId}: ${amount} gold for "${selectedItem.name}"`);
    const offerMessage = `I offer ${amount} gold for the ${selectedItem.name}.`;
    
    handleSendMessage(offerMessage);
  }, [currentMerchantId, handleSendMessage, selectedItem]);

  const handleSellItem = useCallback((amount: number) => {
    if (!inventoryItemToSell) return;
    console.log(`[handleSellItem] Offering to sell to ${currentMerchantId}: "${inventoryItemToSell.name}" for ${amount} gold`);
    const sellMessage = `I want to sell my ${inventoryItemToSell.name} for ${amount} gold.`;
    
    handleSendMessage(sellMessage);
  }, [currentMerchantId, handleSendMessage, inventoryItemToSell]);

  // Initialize the current merchant when it changes or on initial load
  useEffect(() => {
    // Don't automatically initialize merchants on page load
    // Only do so when they are explicitly selected by the user
    const inDirectoryView = currentMerchantId === DEFAULT_MERCHANT_ID;
    
    // If we're in directory view, don't initialize any merchants yet
    if (inDirectoryView) {
      return;
    }
    
    // Only initialize the merchant if it hasn't been initialized yet
    if (!initializedMerchants[currentMerchantId]) {
      initializeMerchant(currentMerchantId);
    } else {
      // Reset displayed response and typing status for the current merchant
      setDisplayedResponse('');
      setIsTyping(false);
      
      // If the merchant has messages, check if we need to type the last one
      const merchantMessages = merchantChatHistories[currentMerchantId] || [];
      if (merchantMessages.length > 0) {
        const lastMessage = merchantMessages[merchantMessages.length - 1];
        if (lastMessage.role === 'merchant') {
          setDisplayedResponse('');
          setIsTyping(true);
        }
      }
    }
  }, [currentMerchantId, initializedMerchants, initializeMerchant, merchantChatHistories]);

  // Handle typing animation effect
  useEffect(() => {
    if (isTyping && currentMerchantChatHistory.length > 0) {
      const merchantMessage = currentMerchantChatHistory[currentMerchantChatHistory.length - 1].content;
      
      // If we've already finished typing, exit early
      if (displayedResponse.length >= merchantMessage.length) {
        setIsTyping(false);
        return;
      }
      
      // Compute how many characters to add in this chunk (10-15 chars)
      const chunkSize = Math.floor(Math.random() * 6) + 10;
      const nextPos = Math.min(displayedResponse.length + chunkSize, merchantMessage.length);
      
      const timer = setTimeout(() => {
        setDisplayedResponse(merchantMessage.substring(0, nextPos));
        
        // If we reached the end, stop typing
        if (nextPos >= merchantMessage.length) {
          setIsTyping(false);
        }
      }, 30); // A bit faster than before
      
      return () => clearTimeout(timer);
    }
  }, [isTyping, displayedResponse, currentMerchantChatHistory]);

  // Clear caches when switching merchants or on reset
  useEffect(() => {
    if (currentMerchantChatHistory.length === 0) {
      // Clear item cache for this merchant to avoid stale data
      // We'll keep deal cache as it's message-specific, not merchant-specific
      itemParsingCache.clear();
    }
  }, [currentMerchantId, currentMerchantChatHistory.length]);

  return {
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
    inventoryItemToSell,
    // Expose multi-merchant specific data and actions
    currentMerchantId,
    merchants,
    setCurrentMerchantId,
    currentMerchantItems,
    currentMerchantChatHistory,
    parseUIActionsFromResponse,  // Expose the function for testing if needed
  };
} 