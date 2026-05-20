# Wedding Planning Web Application - Complete Implementation Guide

## Project Overview
Build a comprehensive digital wedding planning solution for managing engagement and wedding events, including guest lists, vendor management, budget tracking, and theme planning.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Supabase Real-time
- **Hosting**: Vercel (Frontend) + Supabase (Backend)

---

## Database Schema (Supabase)

### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('bride', 'groom', 'family', 'planner')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('engagement', 'wedding', 'reception', 'sangeet', 'mehendi', 'haldi', 'other')),
  event_date DATE NOT NULL,
  venue TEXT,
  venue_address TEXT,
  theme_name TEXT,
  theme_colors TEXT[], -- Array of hex colors
  theme_description TEXT,
  estimated_guests INTEGER,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Guests Table
```sql
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  side TEXT CHECK (side IN ('bride', 'groom')),
  relation TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  age_group TEXT CHECK (age_group IN ('child', 'adult', 'senior')),
  dietary_restrictions TEXT[],
  plus_one BOOLEAN DEFAULT FALSE,
  invitation_status TEXT CHECK (invitation_status IN ('not_sent', 'sent', 'delivered', 'opened')) DEFAULT 'not_sent',
  rsvp_status TEXT CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')) DEFAULT 'pending',
  rsvp_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Event Guests (Many-to-Many)
```sql
CREATE TABLE event_guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  invited BOOLEAN DEFAULT TRUE,
  attended BOOLEAN DEFAULT FALSE,
  UNIQUE(event_id, guest_id)
);
```

### 5. Budget Categories Table
```sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES budget_categories(id),
  sort_order INTEGER DEFAULT 0
);

-- Insert default categories
INSERT INTO budget_categories (name, description, sort_order) VALUES
('Venue & Catering', 'Venue rental, catering, food, beverages', 1),
('Photography & Videography', 'Photographers, videographers, albums', 2),
('Decor & Flowers', 'Floral arrangements, stage decor, lighting', 3),
('Attire & Jewelry', 'Bride/groom outfits, jewelry, accessories', 4),
('Entertainment', 'DJ, band, performers, sound system', 5),
('Invitations & Stationery', 'Cards, printing, postage', 6),
('Transportation', 'Guest transport, wedding car, parking', 7),
('Accommodation', 'Hotel bookings for guests', 8),
('Makeup & Beauty', 'Bridal makeup, mehendi, spa', 9),
('Gifts & Favors', 'Return gifts, guest favors', 10),
('Miscellaneous', 'Other expenses', 99);
```

### 6. Budget Items Table
```sql
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id),
  item_name TEXT NOT NULL,
  description TEXT,
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(10, 2),
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'partial', 'paid')) DEFAULT 'unpaid',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  vendor_id UUID REFERENCES vendors(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. Vendors Table
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  website TEXT,
  rating DECIMAL(2, 1) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
  transaction_id TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. Tasks/Checklist Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')) DEFAULT 'todo',
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10. Documents/Files Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT CHECK (category IN ('contract', 'invoice', 'inspiration', 'guest_list', 'other')),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. Timeline/Schedule Table
```sql
CREATE TABLE timeline_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Authenticated users can read all events
CREATE POLICY "Authenticated users can view events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Event creators can update their events
CREATE POLICY "Creators can update events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Similar policies for other tables (allow authenticated users full access for now)
CREATE POLICY "Authenticated users can manage guests" ON guests
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage budget" ON budget_items
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Next.js Project Structure

```
wedding-planner/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── events/
│   │   │   ├── page.tsx             # Events list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx         # Event details
│   │   │   │   ├── guests/
│   │   │   │   │   └── page.tsx     # Guest management
│   │   │   │   ├── budget/
│   │   │   │   │   └── page.tsx     # Budget tracking
│   │   │   │   ├── vendors/
│   │   │   │   │   └── page.tsx     # Vendor management
│   │   │   │   ├── timeline/
│   │   │   │   │   └── page.tsx     # Event timeline
│   │   │   │   └── tasks/
│   │   │   │       └── page.tsx     # Task checklist
│   │   │   └── new/
│   │   │       └── page.tsx         # Create new event
│   │   ├── guests/
│   │   │   └── page.tsx             # All guests view
│   │   ├── budget/
│   │   │   └── page.tsx             # Overall budget
│   │   ├── vendors/
│   │   │   └── page.tsx             # All vendors
│   │   └── settings/
│   │       └── page.tsx             # User settings
│   ├── api/
│   │   └── webhooks/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx                     # Landing page
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── StatsCard.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── ThemePicker.tsx
│   ├── guests/
│   │   ├── GuestTable.tsx
│   │   ├── GuestForm.tsx
│   │   ├── RSVPTracker.tsx
│   │   └── GuestImport.tsx
│   ├── budget/
│   │   ├── BudgetChart.tsx
│   │   ├── BudgetTable.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── PaymentTracker.tsx
│   ├── vendors/
│   │   ├── VendorCard.tsx
│   │   ├── VendorForm.tsx
│   │   └── VendorComparison.tsx
│   ├── timeline/
│   │   ├── TimelineView.tsx
│   │   └── TimelineItem.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── hooks/
│   │   ├── useEvents.ts
│   │   ├── useGuests.ts
│   │   ├── useBudget.ts
│   │   └── useAuth.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── calculations.ts
│   └── types/
│       └── database.types.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.local
├── middleware.ts
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Features Implementation

### 1. Dashboard Home (`app/(dashboard)/page.tsx`)
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import StatsCard from '@/components/dashboard/StatsCard'

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch summary statistics
  const [eventsResult, guestsResult, budgetResult] = await Promise.all([
    supabase.from('events').select('count'),
    supabase.from('guests').select('count'),
    supabase.from('budget_items').select('estimated_cost, actual_cost, paid_amount')
  ])
  
  const totalBudget = budgetResult.data?.reduce((sum, item) => sum + Number(item.estimated_cost), 0) || 0
  const totalSpent = budgetResult.data?.reduce((sum, item) => sum + Number(item.paid_amount), 0) || 0
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Wedding Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Events" value={eventsResult.count || 0} icon="calendar" />
        <StatsCard title="Total Guests" value={guestsResult.count || 0} icon="users" />
        <StatsCard title="Budget" value={`₹${totalBudget.toLocaleString('en-IN')}`} icon="rupee" />
        <StatsCard title="Spent" value={`₹${totalSpent.toLocaleString('en-IN')}`} icon="wallet" />
      </div>
      
      {/* Recent activities, upcoming tasks, etc. */}
    </div>
  )
}
```

### 2. Guest Management (`components/guests/GuestTable.tsx`)
```typescript
'use client'

import { useState } from 'react'
import { useGuests } from '@/lib/hooks/useGuests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function GuestTable() {
  const { guests, loading, addGuest, updateGuest, deleteGuest } = useGuests()
  const [filter, setFilter] = useState({ search: '', side: 'all', rsvp: 'all' })
  
  const filteredGuests = guests?.filter(guest => {
    const matchesSearch = guest.full_name.toLowerCase().includes(filter.search.toLowerCase())
    const matchesSide = filter.side === 'all' || guest.side === filter.side
    const matchesRsvp = filter.rsvp === 'all' || guest.rsvp_status === filter.rsvp
    return matchesSearch && matchesSide && matchesRsvp
  })
  
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input 
          placeholder="Search guests..." 
          value={filter.search}
          onChange={(e) => setFilter({...filter, search: e.target.value})}
        />
        <select onChange={(e) => setFilter({...filter, side: e.target.value})}>
          <option value="all">All Sides</option>
          <option value="bride">Bride's Side</option>
          <option value="groom">Groom's Side</option>
        </select>
        <select onChange={(e) => setFilter({...filter, rsvp: e.target.value})}>
          <option value="all">All RSVP</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
        <Button onClick={() => {/* Open add guest modal */}}>Add Guest</Button>
      </div>
      
      {/* Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Side</th>
            <th>Relation</th>
            <th>Contact</th>
            <th>RSVP</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredGuests?.map(guest => (
            <tr key={guest.id}>
              <td>{guest.full_name}</td>
              <td><Badge>{guest.side}</Badge></td>
              <td>{guest.relation}</td>
              <td>{guest.phone}</td>
              <td><Badge variant={guest.rsvp_status === 'accepted' ? 'success' : 'warning'}>
                {guest.rsvp_status}
              </Badge></td>
              <td>
                <Button size="sm" onClick={() => {/* Edit */}}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteGuest(guest.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### 3. Budget Tracking (`components/budget/BudgetChart.tsx`)
```typescript
'use client'

import { useBudget } from '@/lib/hooks/useBudget'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function BudgetChart({ eventId }: { eventId?: string }) {
  const { budgetItems, categories } = useBudget(eventId)
  
  const chartData = categories?.map(category => {
    const items = budgetItems?.filter(item => item.category_id === category.id)
    const total = items?.reduce((sum, item) => sum + Number(item.estimated_cost), 0) || 0
    const spent = items?.reduce((sum, item) => sum + Number(item.paid_amount), 0) || 0
    
    return {
      name: category.name,
      budget: total,
      spent: spent,
      remaining: total - spent
    }
  })
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Budget Allocation Pie Chart */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Budget Allocation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={chartData} dataKey="budget" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {chartData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Spending Progress */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Spending Progress</h3>
        {chartData?.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between mb-1">
              <span>{category.name}</span>
              <span>₹{category.spent.toLocaleString('en-IN')} / ₹{category.budget.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(category.spent / category.budget) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 4. Custom Hooks (`lib/hooks/useGuests.ts`)
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Database } from '@/lib/types/database.types'

type Guest = Database['public']['Tables']['guests']['Row']

export function useGuests() {
  const supabase = useSupabaseClient<Database>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchGuests()
    
    // Real-time subscription
    const channel = supabase
      .channel('guests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        fetchGuests()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  async function fetchGuests() {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('full_name')
    
    if (error) console.error('Error fetching guests:', error)
    else setGuests(data || [])
    setLoading(false)
  }
  
  async function addGuest(guest: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('guests')
      .insert(guest)
      .select()
      .single()
    
    if (error) console.error('Error adding guest:', error)
    return data
  }
  
  async function updateGuest(id: string, updates: Partial<Guest>) {
    const { error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', id)
    
    if (error) console.error('Error updating guest:', error)
  }
  
  async function deleteGuest(id: string) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)
    
    if (error) console.error('Error deleting guest:', error)
  }
  
  return { guests, loading, addGuest, updateGuest, deleteGuest }
}
```

---

## Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Package.json Dependencies

```json
{
  "name": "wedding-planner",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.43.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.344.0",
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.12.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

---

## Installation & Setup Steps

### 1. Create Supabase Project
```bash
# Go to https://supabase.com and create a new project
# Copy the project URL and anon key
```

### 2. Setup Database
```bash
# In Supabase SQL Editor, run all the CREATE TABLE statements above
# Run the RLS policies
# Insert default budget categories
```

### 3. Initialize Next.js Project
```bash
npx create-next-app@latest wedding-planner --typescript --tailwind --app
cd wedding-planner
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table badge dialog select toast
npm install recharts date-fns lucide-react zustand
```

### 4. Configure Environment
```bash
# Create .env.local with Supabase credentials
# Update next.config.js if needed
```

### 5. Generate TypeScript Types
```bash
npx supabase gen types typescript --project-id "your-project-ref" > lib/types/database.types.ts
```

---

## Key Features Checklist

### Must-Have Features (MVP)
- [x] User authentication (email/password)
- [x] Event creation (engagement, wedding, etc.)
- [x] Guest list management with bride/groom side
- [x] RSVP tracking
- [x] Budget tracking by category
- [x] Expense recording and payment tracking
- [x] Vendor management
- [x] Basic dashboard with statistics
- [x] Theme/color scheme selection per event

### Advanced Features (Phase 2)
- [ ] WhatsApp/Email invitation sending
- [ ] QR code-based check-in system
- [ ] Guest seating arrangement planner
- [ ] Multi-user collaboration (family members)
- [ ] Document upload (contracts, invoices)
- [ ] Timeline/schedule builder
- [ ] Task checklist with assignments
- [ ] Mobile-responsive design
- [ ] PDF export (guest list, budget report)
- [ ] SMS/Email notifications
- [ ] Photo gallery per event
- [ ] Gift registry tracking

### Premium Features (Phase 3)
- [ ] AI-powered budget recommendations
- [ ] Vendor ratings and reviews
- [ ] Real-time budget alerts
- [ ] Integration with payment gateways
- [ ] Guest travel and accommodation booking
- [ ] Live event countdown
- [ ] Social media integration
- [ ] Multi-language support (English, Hindi, Gujarati)

---

## Deployment Instructions

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Link to Supabase project
```

### Supabase Configuration
```bash
# Enable Auth providers (Email, Google, etc.)
# Configure Storage buckets for file uploads
# Set up RLS policies
# Enable Realtime for live updates
```

---

## Security Considerations

1. **Row Level Security**: All tables must have RLS enabled
2. **Auth Middleware**: Protect dashboard routes with middleware
3. **Input Validation**: Validate all form inputs
4. **File Upload Limits**: Set max file size for documents
5. **Rate Limiting**: Implement rate limiting for API routes
6. **CORS Configuration**: Restrict origins in production

---

## Performance Optimizations

1. **Database Indexes**: Add indexes on frequently queried columns
```sql
CREATE INDEX idx_guests_side ON guests(side);
CREATE INDEX idx_guests_rsvp ON guests(rsvp_status);
CREATE INDEX idx_budget_event ON budget_items(event_id);
CREATE INDEX idx_budget_category ON budget_items(category_id);
```

2. **Image Optimization**: Use Next.js Image component
3. **Code Splitting**: Lazy load heavy components
4. **Caching**: Implement SWR for data fetching
5. **Real-time Subscriptions**: Only subscribe to necessary channels

---

## Testing Strategy

1. **Unit Tests**: Test utility functions and calculations
2. **Integration Tests**: Test Supabase queries
3. **E2E Tests**: Test critical user flows
4. **Manual Testing**: Test on mobile devices

---

## Support & Maintenance

1. **Backup Strategy**: Daily automated Supabase backups
2. **Monitoring**: Set up error tracking (Sentry)
3. **Analytics**: Track user behavior (Vercel Analytics)
4. **Updates**: Keep dependencies updated monthly

---

## Additional Notes

- **Indian Context**: All currency in INR (₹), date formats DD/MM/YYYY
- **Scalability**: Schema supports multiple events per user
- **Offline Mode**: Consider PWA for offline access
- **Data Export**: Allow users to export all data as CSV/PDF
- **Privacy**: GDPR/data protection compliance for guest data

---

## Quick Start Commands

```bash
# Clone and setup
git init wedding-planner
cd wedding-planner
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy
vercel --prod
```

---

## Support Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- Shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com/docs

---

**IMPLEMENTATION PRIORITY:**
1. Authentication & User Management
2. Event Creation & Management
3. Guest List & RSVP System
4. Budget Tracking & Categories
5. Dashboard & Statistics
6. Vendor Management
7. Additional Features

This context file provides everything needed to build a production-ready wedding planning application. Start with the MVP features and progressively enhance.