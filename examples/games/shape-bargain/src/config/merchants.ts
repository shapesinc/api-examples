export interface MerchantConfig {
  id: string; // e.g., 'hutao-qaiq'
  name: string; // e.g., 'Hu Tao'
  avatar: string; // e.g., '/avatars/hutao.png'
  greeting?: string; // Optional: A unique greeting if needed, though the main prompt will handle general greetings.
}

export const MERCHANTS_CONFIG: MerchantConfig[] = [
  { id: 'hutao-qaiq', name: 'Hu Tao', avatar: '/merchant-hutao.png' },
  { id: 'tenshi', name: 'Tenshi', avatar: '/merchant-tenshi.png' },
  { id: 'talkingbenn', name: 'Talking Ben', avatar: '/merchant-benn.png' },
];

// Placeholder for a default merchant if needed, or can be the first from the array.
export const DEFAULT_MERCHANT_ID = MERCHANTS_CONFIG[0].id; 