'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  Store,
  Search,
  Filter,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VendorCard } from '@/components/vendors/VendorCard';
import { VendorForm } from '@/components/vendors/VendorForm';
import { VendorComparison } from '@/components/vendors/VendorComparison';
import { EmptyState } from '@/components/shared/EmptyState';
import { useVendors } from '@/lib/hooks/useVendors';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { VENDOR_CATEGORIES } from '@/lib/constants';
import type { Vendor } from '@/lib/types/database.types';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function VendorsPage() {
  const { vendors, loading, deleteVendor } = useVendors();
  const { confirm } = useConfirm();
  const { can } = useWorkspace();
  const canCreate = can('create_vendor');
  const canEdit = can('edit_vendor');
  const canDelete = can('delete_vendor');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [compareList, setCompareList] = useState<Vendor[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !search ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.category.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_person?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [vendors, search, categoryFilter]);

  function toggleCompare(vendor: Vendor) {
    const exists = compareList.find((v) => v.id === vendor.id);
    if (exists) {
      setCompareList(compareList.filter((v) => v.id !== vendor.id));
    } else if (compareList.length < 4) {
      setCompareList([...compareList, vendor]);
    }
  }

  async function onDelete(vendor: Vendor) {
    const ok = await confirm({
      title: 'Delete vendor',
      description: `Delete ${vendor.name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (ok) await deleteVendor(vendor.id);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Vendors
          </h1>
          <p className="text-muted-foreground mt-1">
            {vendors.length} {vendors.length === 1 ? 'vendor' : 'vendors'} in your directory.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compareList.length >= 2 && (
            <Button
              variant="outline"
              onClick={() => setCompareOpen(true)}
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare ({compareList.length})
            </Button>
          )}
          {canCreate && (
            <Button
              className="bg-rose-500 hover:bg-rose-600"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add vendor
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-3 w-3 mr-1.5 opacity-50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {VENDOR_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading vendors…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Store}
          title={vendors.length === 0 ? 'No vendors yet' : 'No matches'}
          description={
            vendors.length === 0
              ? 'Add photographers, decorators, caterers, and other vendors to keep all your contacts in one place.'
              : 'Try a different search or filter.'
          }
          action={
            vendors.length === 0 && canCreate ? (
              <Button
                className="bg-rose-500 hover:bg-rose-600"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Add first vendor
              </Button>
            ) : undefined
          }
        />
      )}

      {filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={canEdit ? setEditing : undefined}
              onDelete={canDelete ? onDelete : undefined}
              onCompareToggle={toggleCompare}
              isComparing={Boolean(
                compareList.find((v) => v.id === vendor.id)
              )}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new vendor</DialogTitle>
          </DialogHeader>
          <VendorForm onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
          </DialogHeader>
          {editing && (
            <VendorForm initial={editing} onDone={() => setEditing(null)} />
          )}
        </DialogContent>
      </Dialog>

      <VendorComparison
        vendors={compareList}
        open={compareOpen}
        onOpenChange={setCompareOpen}
        onRemove={(v) =>
          setCompareList(compareList.filter((cv) => cv.id !== v.id))
        }
      />
    </div>
  );
}
