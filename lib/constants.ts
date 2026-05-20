import type { EventType, Side, RsvpStatus, PaymentStatus, Priority } from '@/lib/types/database.types';

export const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'engagement', label: 'Engagement', emoji: 'ring' },
  { value: 'haldi', label: 'Haldi', emoji: 'sun' },
  { value: 'mehendi', label: 'Mehendi', emoji: 'leaf' },
  { value: 'sangeet', label: 'Sangeet', emoji: 'music' },
  { value: 'wedding', label: 'Wedding', emoji: 'heart' },
  { value: 'reception', label: 'Reception', emoji: 'party' },
  { value: 'other', label: 'Other', emoji: 'star' },
];

export const SIDES: { value: Side; label: string }[] = [
  { value: 'bride', label: "Bride's Side" },
  { value: 'groom', label: "Groom's Side" },
];

export const RSVP_STATUSES: {
  value: RsvpStatus;
  label: string;
  color: string;
}[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'declined', label: 'Declined', color: 'bg-rose-100 text-rose-800' },
  { value: 'tentative', label: 'Tentative', color: 'bg-blue-100 text-blue-800' },
];

export const PAYMENT_STATUSES: {
  value: PaymentStatus;
  label: string;
  color: string;
}[] = [
  { value: 'unpaid', label: 'Unpaid', color: 'bg-rose-100 text-rose-800' },
  { value: 'partial', label: 'Partial', color: 'bg-amber-100 text-amber-800' },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-100 text-emerald-800' },
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'bg-rose-100 text-rose-800' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-800' },
  { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-700' },
];

export const PRESET_THEMES = [
  {
    name: 'Royal Red & Gold',
    colors: ['#8B0000', '#D4AF37', '#FFFFFF'],
    description: 'Classic Indian wedding palette',
  },
  {
    name: 'Pastel Pink',
    colors: ['#FFB6C1', '#FFE4E1', '#FFFAF0'],
    description: 'Soft and romantic',
  },
  {
    name: 'Emerald & Ivory',
    colors: ['#046307', '#FFF8DC', '#D4AF37'],
    description: 'Lush garden theme',
  },
  {
    name: 'Sunset Orange',
    colors: ['#FF6B35', '#F7C59F', '#EFEFD0'],
    description: 'Warm and vibrant',
  },
  {
    name: 'Midnight Blue & Silver',
    colors: ['#191970', '#C0C0C0', '#FFFFFF'],
    description: 'Elegant evening affair',
  },
  {
    name: 'Coral & Mint',
    colors: ['#FF7F50', '#98FF98', '#FFFAF0'],
    description: 'Beach wedding vibe',
  },
  {
    name: 'Lavender Dreams',
    colors: ['#967BB6', '#E6E6FA', '#FFFFFF'],
    description: 'Whimsical and dreamy',
  },
  {
    name: 'Rustic Burgundy',
    colors: ['#800020', '#C9A227', '#F4E4BC'],
    description: 'Vintage barn wedding',
  },
];

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Jain',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Nut Allergy',
  'Dairy-Free',
  'Diabetic',
];

export const RELATIONS = [
  'Parent',
  'Sibling',
  'Grandparent',
  'Uncle',
  'Aunt',
  'Cousin',
  'Nephew',
  'Niece',
  'Friend',
  'Colleague',
  'Neighbor',
  'Other',
];

export const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photographer',
  'Videographer',
  'Decorator',
  'Florist',
  'DJ / Music',
  'Makeup Artist',
  'Mehendi Artist',
  'Priest / Pandit',
  'Transport',
  'Invitation Designer',
  'Jeweler',
  'Outfit Designer',
  'Other',
];
