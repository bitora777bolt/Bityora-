export interface PresetAvatar {
  id: string;
  name: string;
  category: 'money' | 'ferrari' | 'bmw' | 'money_dog' | 'inr' | 'luxury';
  imageUrl: string;
  badge: string;
}

export const LUXURY_AVATARS: PresetAvatar[] = [
  {
    id: 'avatar-dollar',
    name: 'Money Dollar Cash',
    category: 'money',
    imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=150&auto=format&fit=crop&q=80',
    badge: '💵 USD',
  },
  {
    id: 'avatar-ferrari',
    name: 'Red Ferrari F8',
    category: 'ferrari',
    imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=150&auto=format&fit=crop&q=80',
    badge: '🏎️ Ferrari',
  },
  {
    id: 'avatar-bmw',
    name: 'BMW M-Series',
    category: 'bmw',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=150&auto=format&fit=crop&q=80',
    badge: '🚗 BMW',
  },
  {
    id: 'avatar-doge',
    name: 'Money Dog VIP',
    category: 'money_dog',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80',
    badge: '🐕 Money Dog',
  },
  {
    id: 'avatar-inr',
    name: 'Gold INR Rupee',
    category: 'inr',
    imageUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=150&auto=format&fit=crop&q=80',
    badge: '🪙 ₹ INR',
  },
  {
    id: 'avatar-gold-bars',
    name: 'Pure Gold Bullion',
    category: 'luxury',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=150&auto=format&fit=crop&q=80',
    badge: '👑 24K Gold',
  },
];

export const SIMULATED_PLAYERS = [
  {
    name: 'Rajveer "Ferrari" Singh',
    id: 'BIT-884210',
    avatar: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=150&auto=format&fit=crop&q=80',
    tag: '🏎️ Ferrari VIP',
  },
  {
    name: 'MoneyDog_99',
    id: 'BIT-772911',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop&q=80',
    tag: '🐕 Money Dog',
  },
  {
    name: 'Kabir Dollar Stack',
    id: 'BIT-554109',
    avatar: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=150&auto=format&fit=crop&q=80',
    tag: '💵 Money Dollar',
  },
  {
    name: 'Aaryan BMW M-Power',
    id: 'BIT-993812',
    avatar: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=150&auto=format&fit=crop&q=80',
    tag: '🚗 BMW Club',
  },
  {
    name: 'Vikram ₹ INR King',
    id: 'BIT-440192',
    avatar: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=150&auto=format&fit=crop&q=80',
    tag: '🪙 Gold INR',
  },
  {
    name: 'Zara Gold Bullion',
    id: 'BIT-661048',
    avatar: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=150&auto=format&fit=crop&q=80',
    tag: '👑 24K Vault',
  },
];
