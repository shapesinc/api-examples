import { useState, useEffect, useCallback, useMemo } from 'react';
import useGameStore from '@/store/gameStore';
import { chatWithMerchant } from '@/lib/shapes-api';
import { type Item } from '@/store/gameStore';
import { MERCHANT_PROMPT } from '@/lib/merchantPrompt';

// Cache for item parsing results to avoid redundant processing
const itemParsingCache = new Map<string, Item[]>();
// Cache for deal parsing results
const dealParsingCache = new Map<string, any>();

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

    console.log('[parseItemsFromResponse] Processing content');
    console.log('[parseItemsFromResponse] Raw content:', content);
    
    // Check for specific item patterns that may appear in various formats
    const patterns = [
      // Standard bullet pattern: "* Item Name (100 gold)"
      /(?:^|\n|\r)[*-]\s*([^(]+?)\s*\((\d+)\s*gold\)/gim,
      
      // Alternative format that might appear: "Item Name - 100 gold"
      /(?:^|\n|\r)([^-:\n\r]+?)\s*[-–]\s*(\d+)\s*gold/gim,
      
      // Items mentioned with price: "the Item Name (costs 100 gold)"
      /\b(?:the|a|an)\s+([^()\n\r,]{3,30}?)\s*(?:\((?:costs?|worth|priced at)\s+)?(\d+)\s*gold/gi
    ];
    
    let allItems: { name: string, basePrice: number, id: string }[] = [];
    
    // Try each pattern
    for (let i = 0; i < patterns.length; i++) {
      const matches = Array.from(content.matchAll(patterns[i]));
      console.log(`[parseItemsFromResponse] Pattern ${i+1} matches:`, matches.length);
      if (matches.length > 0) {
        console.log(`[parseItemsFromResponse] First match for pattern ${i+1}:`, matches[0]);
      }
      
      const patternItems = matches
        .map(match => {
          // Only process if we have both name and price
          if (match[1] && match[2]) {
            const name = match[1].trim();
            const price = parseInt(match[2], 10);
            
            // Only create item if we have valid name and price
            if (name && !isNaN(price) && name.length > 2 && price > 0) {
              return {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                basePrice: price
              };
            }
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
      allItems = [...allItems, ...patternItems];
    }
    
    // Remove duplicates based on name
    const uniqueItems = allItems.filter((item, index, self) =>
      index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
    );
    
    console.log('[parseItemsFromResponse] Total unique items found:', uniqueItems.length);
    if (uniqueItems.length > 0) {
      console.log('[parseItemsFromResponse] Items:', uniqueItems.map(i => `${i.name} (${i.basePrice} gold)`).join(', '));
    }
    
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

    console.log('[parseDealFromResponse] Processing content');
    console.log('[parseDealFromResponse] Raw content:', content);
    
    // Fast check if content likely contains a deal block before running regex
    if (!content.includes('```') || (!content.includes('status:') && !content.includes('price:'))) {
      console.log('[parseDealFromResponse] No deal block markers found');
      dealParsingCache.set(content, null);
      return null;
    }

    const dealBlockMatch = content.match(/```(?:deal)?\s*([\s\S]*?)```/i);
    if (!dealBlockMatch) {
      console.log('[parseDealFromResponse] Tried to extract deal block but no match');
      dealParsingCache.set(content, null);
      return null;
    }

    console.log('[parseDealFromResponse] Found deal block:', dealBlockMatch[1]);
    const dealText = dealBlockMatch[1].trim();
    
    try {
      // First try to parse the new multi-item format
      if (dealText.includes('items:') && (dealText.includes('[') || dealText.includes('{'))) {
        // Try to parse the JSON with some flexibility
        let jsonText = dealText
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":') // Add quotes to keys
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        // Handle cases where JSON might be malformed
        try {
                     // Try to extract just the items array if available
           const itemsMatch = jsonText.match(/"items":\s*(\[[\s\S]*?\])/);
           const statusMatch = jsonText.match(/"status":\s*"([^"]+)"/);
           const sellerMatch = jsonText.match(/"seller":\s*"([^"]+)"/);
                     
          const items = itemsMatch ? JSON.parse(itemsMatch[1]) : [];
          const status = statusMatch ? statusMatch[1] : '';
          const seller = sellerMatch ? sellerMatch[1] : 'merchant';
          
          // Check if the message contains "[DEAL ACCEPTED]" indicator
          const hasDealAcceptedIndicator = content.includes('[DEAL ACCEPTED]');
          
          const result = {
            multiItem: true,
            items: items.map((item: any) => ({
              name: item.name || '',
              quantity: item.quantity || 1,
              price: item.price || 0
            })),
            status: hasDealAcceptedIndicator ? 'accepted' : status,
            seller: seller
          };
          
          console.log(`[parseDealFromResponse] Extracted multi-item deal:`, result);
          console.log(`[parseDealFromResponse] Deal accepted indicator present:`, hasDealAcceptedIndicator);
          
          dealParsingCache.set(content, result);
          return result;
        } catch (err) {
          console.log('[parseDealFromResponse] Error parsing multi-item JSON, falling back to basic format', err);
          // Fall back to legacy format if JSON parsing fails
        }
      }
      
      // Legacy format parsing (for backward compatibility)
      const lines = dealText.split('\n');
      const deal: Record<string, string> = {};

      for (const line of lines) {
        const [key, ...rest] = line.split(':');
        if (!key || rest.length === 0) continue;
        deal[key.trim().toLowerCase()] = rest.join(':').trim();
      }

      // Check for quantity mention in the item name or in the message
      let quantity = 1;
      let itemName = deal.item || '';
      
      // Check if there's a quantity in the item name like "2 health potions"
      const quantityMatch = itemName.match(/^(\d+)\s+(.+)$/);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1], 10);
        itemName = quantityMatch[2].trim();
      } else {
        // Search the whole message for quantity mentions
        const fullMessageQuantityMatch = content.match(/(\d+)\s+(?:of\s+)?(?:the\s+)?(?:your\s+)?(?:my\s+)?([\w\s'-]+)(?:\s+for|at)\s+(\d+)/i);
        if (fullMessageQuantityMatch) {
          const messageQuantity = parseInt(fullMessageQuantityMatch[1], 10);
          const messageItem = fullMessageQuantityMatch[2].trim();
          
          // Only use if the item names approximately match
          if (messageItem.toLowerCase().includes(itemName.toLowerCase()) || 
              itemName.toLowerCase().includes(messageItem.toLowerCase())) {
            quantity = messageQuantity;
            // Use the more specific item name
            if (messageItem.length > itemName.length) {
              itemName = messageItem;
            }
          }
        }
      }

      // Check if the message contains "[DEAL ACCEPTED]" indicator
      const hasDealAcceptedIndicator = content.includes('[DEAL ACCEPTED]');

      const result = {
        multiItem: false,
        items: [{
          name: itemName,
          quantity: quantity,
          price: parseInt(deal.price) || 0
        }],
        // Override status to 'accepted' if the "[DEAL ACCEPTED]" indicator is present
        status: hasDealAcceptedIndicator ? 'accepted' : deal.status,
        seller: deal.seller || 'merchant' // Default to 'merchant' if not specified
      };

      console.log(`[parseDealFromResponse] Extracted single-item deal:`, result);
      console.log(`[parseDealFromResponse] Deal accepted indicator present:`, hasDealAcceptedIndicator);

      // Cache the result
      dealParsingCache.set(content, result);
      return result;
    } catch (error) {
      console.error('[parseDealFromResponse] Error parsing deal:', error);
      dealParsingCache.set(content, null);
      return null;
    }
  }, []);

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
      
      // Send the merchant prompt
      console.log(`[initializeMerchant] Sending initial merchant prompt to ${merchantId}`);
      const response = await chatWithMerchant(
        MERCHANT_PROMPT,
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
      console.log(`[handleSendMessage] Sending message to ${currentMerchantId}:`, currentMessage);
      
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
          // Add merchant response to chat history
          console.log(`[handleSendMessage] Successful response from ${currentMerchantId}:`, response.message);
          
          // Normalize line breaks to handle potential inconsistencies
          const normalizedMessage = response.message.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          
          addMessageToMerchantHistory(currentMerchantId, { 
            role: 'merchant', 
            content: normalizedMessage 
          });
          
          setIsTyping(true);
          setLastParsedMessage(normalizedMessage);
          
          // Only parse items and deals once per message
          const newItems = parseItemsFromResponse(normalizedMessage);
          console.log(`[handleSendMessage] Scanning for items from ${currentMerchantId}, found:`, newItems.length);
          
          if (newItems.length > 0) {
            console.log(`[handleSendMessage] New items discovered from ${currentMerchantId}:`, newItems);
            setHasNewItems(true);
            // Reset notification after 3 seconds
            setTimeout(() => setHasNewItems(false), 3000);
          }
          
          // Add items to current merchant's wares
          newItems.forEach(item => {
            addItemToMerchantWares(currentMerchantId, item);
            // Also update legacy state for compatibility
            addDiscoveredItem(item);
          });

          // Handle deal response if present
          const dealResponse = parseDealFromResponse(normalizedMessage);
          if (dealResponse) {
            console.log(`[handleSendMessage] Processed deal from ${currentMerchantId}:`, dealResponse);
            
            if (dealResponse.status === 'accepted' || (dealResponse.status === 'pending' && response.message.includes('[DEAL ACCEPTED]'))) {
              console.log(`[handleSendMessage] Deal with ${currentMerchantId} is accepted, processing transaction`);
              
              if (dealResponse.seller === 'player') {
                // When the player is the seller (player sells to merchant)
                handleChatSellTransaction(dealResponse);
              } else {
                // When the merchant is the seller (player buys from merchant)
                handleChatBuyTransaction(dealResponse);
              }
            } else {
              console.log(`[handleSendMessage] Deal with ${currentMerchantId} was rejected or still pending, status:`, dealResponse.status);
            }
          }
        }
      } else {
        console.log(`[handleSendMessage] Response from ${currentMerchantId} not successful`);
        if (!currentMessage.startsWith('!')) {
          addMessageToMerchantHistory(currentMerchantId, {
            role: 'merchant',
            content: response.message || 'The merchant seems distracted...'
          });
        }
      }
    } catch (error) {
      console.error(`[handleSendMessage] Error handling message to ${currentMerchantId}:`, error);
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
    currentMerchantChatHistory
  };
} 