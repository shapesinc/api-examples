import { type Item } from '@/store/gameStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MerchantShopProps {
  gold: number;
  discoveredItems: Item[];
  inventory: Item[];
  selectedItem: Item | null;
  inventoryItemToSell: Item | null;
  onSelectItem: (item: Item) => void;
  onMakeOffer: (amount: number) => void;
  onSelectInventoryItem: (item: Item) => void;
  onSellItem: (amount: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  merchantName?: string;
}

export default function MerchantShop({
  gold,
  discoveredItems,
  inventory,
  selectedItem,
  inventoryItemToSell,
  onSelectItem,
  onMakeOffer,
  onSelectInventoryItem,
  onSellItem,
  isOpen,
  onToggle,
  merchantName = 'Merchant'
}: MerchantShopProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full max-w-[500px] w-full bg-background border-l shadow-lg z-50 overflow-hidden"
        >
          <div className="flex flex-col h-full">
            <div className="p-6 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xl font-main text-yellow-600 pb-2">🪙</span>
                <span className="text-lg font-main text-yellow-600">{gold}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="rounded-full"
                aria-label="Close merchant&apos;s wares menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Shop Section - 2/3 height */}
            <div className="px-6 pt-3 pb-2 border-t">
              <h3 className="font-secondary-semibold text-sm text-gray-500">{merchantName}&apos;s Wares</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2" style={{ height: '50%' }}>
              <div className="space-y-2">
                {discoveredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-2 cursor-pointer hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ${
                      selectedItem?.id === item.id ? 'ring-2 ring-gray-600' : ''
                    }`}
                    onClick={() => onSelectItem(item)}
                  >
                    <div className="grid grid-cols-6 gap-1">
                      <div className="col-span-4 flex items-start">
                        <h4 className="font-secondary-semibold">{item.name}</h4>
                      </div>
                      <div className="text-right col-span-2">
                        <p className="font-secondary-bold">{item.basePrice} gold</p>
                        {selectedItem?.id === item.id && (
                          <div className="flex flex-col gap-1 mt-2">
                            <Button
                              size="sm"
                              className="font-secondary"
                              onClick={() => {
                                onMakeOffer(Math.floor(item.basePrice * 0.8));
                                onToggle();
                              }}
                            >
                              Offer 80%
                            </Button>
                            <Button
                              size="sm"
                              className="font-secondary"
                              onClick={() => {
                                onMakeOffer(Math.floor(item.basePrice));
                                onToggle();
                              }}
                            >
                              Offer 100%
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {discoveredItems.length === 0 && (
                  <p className="text-start text-gray-500 font-secondary">
                    Ask {merchantName} about their wares...
                  </p>
                )}
              </div>
            </div>

            {/* Inventory Section - 1/3 height */}
            <div className="px-6 py-3 border-t">
              <h3 className="font-secondary-semibold text-sm text-gray-500">Your Inventory</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2 max-h-[50%]">
              <div className="space-y-2">
                {inventory.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`p-2 cursor-pointer hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ${
                      inventoryItemToSell?.id === item.id ? 'ring-2 ring-gray-600' : ''
                    }`}
                    onClick={() => onSelectInventoryItem(item)}
                  >
                    <div className="grid grid-cols-6 gap-1">
                      <div className="col-span-4 flex items-start">
                        <h4 className="font-secondary-semibold">{item.name}</h4>
                      </div>
                      <div className="text-right col-span-2">
                        <p className="font-secondary-bold">{item.basePrice} gold</p>
                        {inventoryItemToSell?.id === item.id && (
                          <div className="flex flex-col gap-1 mt-2">
                            <Button
                              size="sm"
                              className="font-secondary"
                              onClick={() => {
                                onSellItem(Math.floor(item.basePrice * 1.2));
                                onToggle();
                              }}
                            >
                              Ask for 120%
                            </Button>
                            <Button
                              size="sm"
                              className="font-secondary"
                              onClick={() => {
                                onSellItem(Math.floor(item.basePrice * 1));
                                onToggle();
                              }}
                            >
                              Ask for 100%
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {inventory.length === 0 && (
                  <p className="text-gray-500 font-secondary">Your inventory is empty...</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 