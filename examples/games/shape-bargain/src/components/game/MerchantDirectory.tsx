import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { CoinsIcon, SearchIcon, PackageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import useGameStore, { Item as StoreItem } from '@/store/gameStore';

// Define types used by this component
interface Merchant {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  location?: string;
}

// Define an interface for display items with quantity for UI purposes
interface DisplayItem extends StoreItem {
  quantity: number;
  icon?: string;
  instances: StoreItem[];
}

interface MerchantDirectoryProps {
  merchants: Merchant[];
  onSelectMerchant: (merchantId: string) => void;
  gold?: number;
  inventory?: StoreItem[];
}

export default function MerchantDirectory({ 
  merchants, 
  onSelectMerchant,
  gold: propGold,
  inventory: propInventory
}: MerchantDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInventory, setShowInventory] = useState(false);
  
  // Get inventory and gold from the game store
  const storeInventory = useGameStore(state => state.inventory);
  const storeGold = useGameStore(state => state.gold);
  
  // Use props if provided, otherwise use store values
  const gold = propGold !== undefined ? propGold : storeGold;
  const inventory = propInventory || storeInventory;
  
  const filteredMerchants = merchants.filter(merchant => 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (merchant.location && merchant.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const handleSelectMerchant = (id: string) => {
    onSelectMerchant(id);
    // The parent component will handle changing to the chat interface
  };

  // Group identical items together for display purposes
  const groupedInventory = inventory.reduce<DisplayItem[]>((acc, item) => {
    // Find if we already have this item in our grouped items
    const existingItemIndex = acc.findIndex(groupedItem => groupedItem.name === item.name);
    
    if (existingItemIndex >= 0) {
      // Item already exists in our grouped items, update quantity and add to instances
      acc[existingItemIndex].quantity += 1;
      acc[existingItemIndex].instances.push(item);
    } else {
      // This is a new item, add it to our grouped items
      acc.push({
        ...item,
        quantity: 1,
        icon: undefined, // We don't have icons in the store items yet
        instances: [item]
      });
    }
    
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-[600px] rounded-lg overflow-hidden border border-gray-200 shadow-lg bg-secondary min-w-[400px]">
      {/* Header with gold and tabs */}
      <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-xs font-main text-gray-900">Merchant Guild</h1>
        <div className="flex items-center gap-1">
          <span className="text-md font-main text-yellow-600 pb-2">🪙</span>
          <span className="text-sm font-main text-yellow-600">{gold}</span>
        </div>
      </div>
      
      {/* Toggle between merchants and inventory */}
      <div className="flex border-b border-gray-200">
        <button 
          className={cn(
            "flex-1 py-3 text-center font-secondary-medium transition-colors hover:cursor-pointer",
            !showInventory ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-700 hover:bg-gray-100/80"
          )}
          onClick={() => setShowInventory(false)}
        >
          Merchants
        </button>
        <button 
          className={cn(
            "flex-1 py-3 text-center font-secondary-medium transition-colors hover:cursor-pointer",
            showInventory ? "bg-gray-200 text-gray-900" : "bg-gray-100 text-gray-700 hover:bg-gray-100/80"
          )}
          onClick={() => setShowInventory(true)}
        >
          <div className="flex items-center justify-center gap-2">
            <PackageIcon className="h-4 w-4" />
            <span>Inventory</span>
          </div>
        </button>
      </div>
      
      {showInventory ? (
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg font-secondary-semibold text-gray-900 mb-3">Your Items</h2>
          
          {groupedInventory.length === 0 ? (
            <div className="text-center p-6 text-gray-700 font-secondary">
              <PackageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Your inventory is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {groupedInventory.map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3"
                >
                  <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-700 relative">
                    {item.icon || "📦"}
                    {item.quantity > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-secondary-bold">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-secondary-semibold text-gray-900">{item.name}</div>
                    <div className="text-xs font-secondary text-gray-600">
                      {item.quantity > 1 ? `x${item.quantity}` : 'Single item'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search merchants..."
                className="w-full bg-white border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm font-secondary focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Merchants list */}
          <div className="flex-1 overflow-y-auto">
            {filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant) => (
                <motion.div
                  key={merchant.id}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 cursor-pointer transition-colors flex items-center gap-3 border-b hover:bg-yellow-600"
                  onClick={() => handleSelectMerchant(merchant.id)}
                >
                  <Avatar className="h-14 w-14 border-2 border-gray-300">
                    <Image 
                      src={merchant.avatar || "/merchant-benn.png"} 
                      alt={merchant.name}
                      width={56}
                      height={56}
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-secondary-bold text-lg text-gray-900">{merchant.name}</div>
                    {merchant.description && (
                      <div className="text-sm font-secondary text-gray-700 line-clamp-1">{merchant.description}</div>
                    )}
                    {merchant.location && (
                      <div className="text-xs font-secondary text-gray-600 mt-1 flex items-center gap-1">
                        <span>📍 {merchant.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="w-2 h-2 rounded-full bg-green-500 mb-1"></div>
                    <span className="text-xs font-secondary text-gray-600">Online</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-700 font-secondary">
                <p className="mb-2">No merchants found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 