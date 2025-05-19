import { create } from 'zustand';
import { MERCHANTS_CONFIG, DEFAULT_MERCHANT_ID, type MerchantConfig } from '@/config/merchants';

export interface Item {
  id: string;
  name: string;
  basePrice: number;
}

export interface GameState {
  // Merchant configuration
  merchants: MerchantConfig[];
  currentMerchantId: string;
  initializedMerchants: Record<string, boolean>;
  
  // Player state
  gold: number;
  inventory: Item[];
  
  // Merchant-specific state
  merchantWares: Record<string, Item[]>; // Items each merchant has for sale
  merchantChatHistories: Record<string, Array<{ role: 'user' | 'merchant'; content: string }>>;
  
  // UI state
  selectedItem: Item | null;
  inventoryItemToSell: Item | null;
  currentOffer: number | null;
  isShopOpen: boolean; // Added for shop visibility
  
  // Legacy - will be migrated to merchant-specific state
  messages: Array<{ role: 'user' | 'merchant'; content: string }>;
  discoveredItems: Item[]; // Legacy support
  
  // Actions - Merchant management
  setCurrentMerchantId: (merchantId: string) => void;
  setMerchantInitialized: (merchantId: string) => void;
  resetMerchantState: (merchantId: string) => void;
  
  // Actions - Player state
  setGold: (gold: number) => void;
  setSelectedItem: (item: Item | null) => void;
  setInventoryItemToSell: (item: Item | null) => void;
  setCurrentOffer: (offer: number | null) => void;
  setIsShopOpen: (isOpen: boolean) => void; // Added for shop visibility
  
  // Actions - Inventory management
  addToInventory: (item: Item) => void;
  removeFromInventory: (itemId: string) => void;
  
  // Actions - Merchant items management
  addItemToMerchantWares: (merchantId: string, item: Item) => void;
  removeItemFromMerchantWares: (merchantId: string, itemId: string) => void;
  
  // Actions - Chat management
  addMessage: (message: { role: 'user' | 'merchant'; content: string }) => void; // Legacy
  addMessageToMerchantHistory: (merchantId: string, message: { role: 'user' | 'merchant'; content: string }) => void;
  clearMerchantChatHistory: (merchantId: string) => void;
  
  // Legacy support - will redirect to merchant-specific actions
  addDiscoveredItem: (item: Item) => void;
  removeDiscoveredItem: (itemId: string) => void;
  
  // Global actions
  resetGame: () => void;
  clearMessages: () => void;
}

// Maximum number of messages to keep in history
const MAX_MESSAGE_HISTORY = 50;

// Initialize empty data structures for each merchant
const initMerchantData = () => {
  const merchantWares: Record<string, Item[]> = {};
  const merchantChatHistories: Record<string, Array<{ role: 'user' | 'merchant'; content: string }>> = {};
  const initializedMerchants: Record<string, boolean> = {};
  
  MERCHANTS_CONFIG.forEach(merchant => {
    merchantWares[merchant.id] = [];
    merchantChatHistories[merchant.id] = [];
    initializedMerchants[merchant.id] = false;
  });
  
  return { merchantWares, merchantChatHistories, initializedMerchants };
};

const useGameStore = create<GameState>((set, get) => {
  const { merchantWares, merchantChatHistories, initializedMerchants } = initMerchantData();
  
  return {
    // Merchant configuration
    merchants: MERCHANTS_CONFIG,
    currentMerchantId: DEFAULT_MERCHANT_ID,
    initializedMerchants,
    
    // Player state
    gold: 1000,
    inventory: [],
    
    // Merchant-specific state
    merchantWares,
    merchantChatHistories,
    
    // UI state
    selectedItem: null,
    inventoryItemToSell: null,
    currentOffer: null,
    isShopOpen: false, // Initialized shop state
    
    // Legacy state
    messages: [],
    discoveredItems: [], // Legacy support
    
    // Actions - Merchant management
    setCurrentMerchantId: (merchantId) => set({ currentMerchantId: merchantId }),
    
    setMerchantInitialized: (merchantId) => set((state) => ({
      initializedMerchants: { 
        ...state.initializedMerchants, 
        [merchantId]: true 
      }
    })),
    
    resetMerchantState: (merchantId) => set((state) => ({
      merchantWares: { 
        ...state.merchantWares, 
        [merchantId]: [] 
      },
      initializedMerchants: { 
        ...state.initializedMerchants, 
        [merchantId]: false 
      }
    })),
    
    // Actions - Player state
    setGold: (gold) => set({ gold }),
    setSelectedItem: (item) => set({ selectedItem: item }),
    setInventoryItemToSell: (item) => set({ inventoryItemToSell: item }),
    setCurrentOffer: (offer) => set({ currentOffer: offer }),
    setIsShopOpen: (isOpen) => set({ isShopOpen: isOpen }), // Implemented action
    
    // Actions - Inventory management
    addToInventory: (item) => set((state) => ({
      inventory: [...state.inventory, item]
    })),
    
    removeFromInventory: (itemId) => set((state) => ({
      inventory: state.inventory.filter(item => item.id !== itemId),
      inventoryItemToSell: state.inventoryItemToSell?.id === itemId ? null : state.inventoryItemToSell
    })),
    
    // Actions - Merchant items management
    addItemToMerchantWares: (merchantId, item) => set((state) => {
      // Only add if this merchant doesn't already have this item
      const existingItems = state.merchantWares[merchantId] || [];
      if (!existingItems.some(i => i.name === item.name)) {
        return { 
          merchantWares: { 
            ...state.merchantWares, 
            [merchantId]: [...existingItems, item] 
          } 
        };
      }
      return {};
    }),
    
    removeItemFromMerchantWares: (merchantId, itemId) => set((state) => ({
      merchantWares: { 
        ...state.merchantWares, 
        [merchantId]: (state.merchantWares[merchantId] || []).filter(item => item.id !== itemId) 
      }
    })),
    
    // Actions - Chat management
    addMessage: (message) => set((state) => ({ 
      messages: [...state.messages.slice(-MAX_MESSAGE_HISTORY + 1), message] 
    })),
    
    addMessageToMerchantHistory: (merchantId, message) => set((state) => {
      const existingMessages = state.merchantChatHistories[merchantId] || [];
      return { 
        merchantChatHistories: { 
          ...state.merchantChatHistories, 
          [merchantId]: [...existingMessages.slice(-MAX_MESSAGE_HISTORY + 1), message] 
        },
        // Also update legacy messages if this is the current merchant
        ...(merchantId === state.currentMerchantId 
          ? { messages: [...state.messages.slice(-MAX_MESSAGE_HISTORY + 1), message] } 
          : {})
      };
    }),
    
    clearMerchantChatHistory: (merchantId) => set((state) => ({
      merchantChatHistories: { 
        ...state.merchantChatHistories, 
        [merchantId]: [] 
      },
      // Also clear legacy messages if this is the current merchant
      ...(merchantId === state.currentMerchantId ? { messages: [] } : {})
    })),
    
    // Legacy support - redirects to merchant-specific actions
    addDiscoveredItem: (item) => set((state) => {
      // Add to both legacy discoveredItems and current merchant's wares
      const existingItems = state.merchantWares[state.currentMerchantId] || [];
      const legacyExists = state.discoveredItems.some(i => i.name === item.name);
      const merchantExists = existingItems.some(i => i.name === item.name);
      
      return {
        // Add to legacy discoveredItems if not already there
        ...(legacyExists ? {} : { discoveredItems: [...state.discoveredItems, item] }),
        
        // Add to current merchant's wares if not already there
        ...(merchantExists ? {} : {
          merchantWares: { 
            ...state.merchantWares, 
            [state.currentMerchantId]: [...existingItems, item] 
          } 
        })
      };
    }),
    
    removeDiscoveredItem: (itemId) => set((state) => ({
      // Remove from legacy discoveredItems
      discoveredItems: state.discoveredItems.filter(item => item.id !== itemId),
      
      // Also remove from current merchant's wares
      merchantWares: { 
        ...state.merchantWares, 
        [state.currentMerchantId]: (state.merchantWares[state.currentMerchantId] || [])
          .filter(item => item.id !== itemId) 
      }
    })),
    
    // Global actions
    resetGame: () => {
      const { merchantWares, merchantChatHistories, initializedMerchants } = initMerchantData();
      set({
        gold: 1000,
        inventory: [],
        merchantWares,
        merchantChatHistories,
        initializedMerchants,
        selectedItem: null,
        inventoryItemToSell: null,
        currentOffer: null,
        messages: [],
        discoveredItems: [] // Legacy support
      });
    },
    
    clearMessages: () => set((state) => ({ 
      messages: [],
      // Also clear current merchant's chat history
      merchantChatHistories: { 
        ...state.merchantChatHistories, 
        [state.currentMerchantId]: [] 
      }
    }))
  };
});

export default useGameStore; 