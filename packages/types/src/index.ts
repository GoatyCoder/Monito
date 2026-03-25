export * from './user';
export * from './product';
export * from './variety';
export * from './packaging';
export * from './processed-product';
export * from './field-lot';
export * from './pallet';

export type AvatarColor = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'pink' | 'gray';

export const AVATAR_COLORS: { value: AvatarColor; label: string; hex: string; className: string }[] = [
  { value: 'blue', label: 'Blu', hex: '#3B82F6', className: 'bg-blue-500' },
  { value: 'green', label: 'Verde', hex: '#10B981', className: 'bg-green-500' },
  { value: 'violet', label: 'Viola', hex: '#8B5CF6', className: 'bg-violet-500' },
  { value: 'orange', label: 'Arancione', hex: '#F97316', className: 'bg-orange-500' },
  { value: 'red', label: 'Rosso', hex: '#EF4444', className: 'bg-red-500' },
  { value: 'pink', label: 'Rosa', hex: '#EC4899', className: 'bg-pink-500' },
  { value: 'gray', label: 'Grigio', hex: '#6B7280', className: 'bg-gray-500' },
];