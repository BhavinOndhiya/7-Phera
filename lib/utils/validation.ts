import { z } from 'zod';

const eventTypeEnum = z.enum([
  'engagement',
  'wedding',
  'reception',
  'sangeet',
  'mehendi',
  'haldi',
  'other',
]);

export const eventSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  event_type: eventTypeEnum,
  event_date: z.string().min(1, 'Date is required'),
  venue: z.string().optional().nullable(),
  venue_address: z.string().optional().nullable(),
  theme_name: z.string().optional().nullable(),
  theme_colors: z.array(z.string()).optional().nullable(),
  theme_description: z.string().optional().nullable(),
  estimated_guests: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EventInput = z.infer<typeof eventSchema>;

export const guestSchema = z.object({
  full_name: z.string().min(2, 'Name required').max(120),
  side: z.enum(['bride', 'groom']),
  relation: z.string().min(1, 'Relation required'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional().nullable(),
  age_group: z.enum(['child', 'adult', 'senior']).default('adult'),
  dietary_restrictions: z.array(z.string()).optional().nullable(),
  plus_one: z.boolean().default(false),
  party_size: z.coerce.number().int().min(1).max(50).default(1),
  rsvp_status: z
    .enum(['pending', 'accepted', 'declined', 'tentative'])
    .default('pending'),
  notes: z.string().optional().nullable(),
});

export type GuestInput = z.infer<typeof guestSchema>;

export const budgetItemSchema = z.object({
  event_id: z.string().uuid(),
  category_id: z.string().uuid().optional().nullable(),
  item_name: z.string().min(2),
  description: z.string().optional().nullable(),
  estimated_cost: z.coerce.number().min(0),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  vendor_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type BudgetItemInput = z.infer<typeof budgetItemSchema>;

export const vendorSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  contact_person: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().nullable(),
  website: z.string().url().optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  price_range: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  contract_signed: z.boolean().default(false),
});

export type VendorInput = z.infer<typeof vendorSchema>;

export const taskSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z
    .enum(['todo', 'in_progress', 'completed', 'cancelled'])
    .default('todo'),
  assigned_to: z.string().uuid().optional().nullable(),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const timelineItemSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  start_time: z.string().min(1),
  end_time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
});

export type TimelineItemInput = z.infer<typeof timelineItemSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name required'),
  role: z.enum(['bride', 'groom', 'family', 'planner']),
  phone: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
