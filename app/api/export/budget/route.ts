import { NextResponse } from 'next/server';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import React from 'react';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
  },
  header: { marginBottom: 16, borderBottom: '2 solid #fb2e63', paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#9f1239' },
  subtitle: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', marginBottom: 14, gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: '#fff1f2',
    borderRadius: 6,
    padding: 8,
  },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#9f1239' },
  statLabel: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#9f1239',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff1f2',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '1 solid #e5e7eb',
    fontSize: 9,
  },
  col1: { flex: 4 },
  col2: { flex: 2, textAlign: 'right' },
  col3: { flex: 2, textAlign: 'right' },
  col4: { flex: 1.5, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: '#fdf6e3',
    fontWeight: 'bold',
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
  },
});

interface ItemRow {
  item_name: string;
  category_name: string;
  estimated_cost: number;
  actual_cost: number | null;
  paid_amount: number;
  payment_status: string;
}

function fmt(n: number) {
  return `Rs. ${Math.round(n).toLocaleString('en-IN')}`;
}

function buildDoc({
  eventName,
  items,
}: {
  eventName: string;
  items: ItemRow[];
}) {
  const totals = items.reduce(
    (acc, i) => {
      acc.est += i.estimated_cost;
      acc.act += i.actual_cost ?? 0;
      acc.paid += i.paid_amount;
      return acc;
    },
    { est: 0, act: 0, paid: 0 }
  );

  const grouped = items.reduce<Record<string, ItemRow[]>>((acc, i) => {
    const key = i.category_name || 'Uncategorised';
    acc[key] = acc[key] ?? [];
    acc[key].push(i);
    return acc;
  }, {});

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, eventName),
        React.createElement(Text, { style: styles.subtitle }, 'Budget report')
      ),
      React.createElement(
        View,
        { style: styles.statsRow },
        React.createElement(
          View,
          { style: styles.stat },
          React.createElement(Text, { style: styles.statValue }, fmt(totals.est)),
          React.createElement(Text, { style: styles.statLabel }, 'Estimated')
        ),
        React.createElement(
          View,
          { style: styles.stat },
          React.createElement(Text, { style: styles.statValue }, fmt(totals.act)),
          React.createElement(Text, { style: styles.statLabel }, 'Actual')
        ),
        React.createElement(
          View,
          { style: styles.stat },
          React.createElement(Text, { style: styles.statValue }, fmt(totals.paid)),
          React.createElement(Text, { style: styles.statLabel }, 'Paid')
        ),
        React.createElement(
          View,
          { style: styles.stat },
          React.createElement(Text, { style: styles.statValue }, fmt(totals.act - totals.paid)),
          React.createElement(Text, { style: styles.statLabel }, 'Outstanding')
        )
      ),
      ...Object.entries(grouped).flatMap(([category, rows]) => [
        React.createElement(Text, { key: `t-${category}`, style: styles.sectionTitle }, category),
        React.createElement(
          View,
          { key: `h-${category}`, style: styles.tableHeader },
          React.createElement(Text, { style: styles.col1 }, 'Item'),
          React.createElement(Text, { style: styles.col2 }, 'Estimated'),
          React.createElement(Text, { style: styles.col3 }, 'Actual'),
          React.createElement(Text, { style: styles.col4 }, 'Status')
        ),
        ...rows.map((row, idx) =>
          React.createElement(
            View,
            { key: `r-${category}-${idx}`, style: styles.tableRow },
            React.createElement(Text, { style: styles.col1 }, row.item_name),
            React.createElement(Text, { style: styles.col2 }, fmt(row.estimated_cost)),
            React.createElement(Text, { style: styles.col3 }, fmt(row.actual_cost ?? 0)),
            React.createElement(Text, { style: styles.col4 }, row.payment_status)
          )
        ),
      ]),
      React.createElement(
        View,
        { style: styles.totalRow, wrap: false },
        React.createElement(Text, { style: styles.col1 }, 'Grand total'),
        React.createElement(Text, { style: styles.col2 }, fmt(totals.est)),
        React.createElement(Text, { style: styles.col3 }, fmt(totals.act)),
        React.createElement(Text, { style: styles.col4 }, fmt(totals.paid) + ' paid')
      ),
      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        `Generated by Saath Phere · ${new Date().toLocaleDateString()}`
      )
    )
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  if (!eventId) {
    return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [{ data: event }, { data: items }, { data: categories }] =
    await Promise.all([
      supabase.from('events').select('name').eq('id', eventId).maybeSingle(),
      supabase
        .from('budget_items')
        .select(
          'item_name, category_id, estimated_cost, actual_cost, paid_amount, payment_status'
        )
        .eq('event_id', eventId),
      supabase.from('budget_categories').select('id, name'),
    ]);

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const catMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const rows: ItemRow[] = (items ?? []).map((i) => ({
    item_name: i.item_name,
    category_name: i.category_id ? catMap.get(i.category_id) ?? '' : '',
    estimated_cost: Number(i.estimated_cost) || 0,
    actual_cost: i.actual_cost != null ? Number(i.actual_cost) : null,
    paid_amount: Number(i.paid_amount) || 0,
    payment_status: i.payment_status,
  }));

  const doc = buildDoc({ eventName: event.name, items: rows });
  const buffer = await renderToBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_')}_budget.pdf"`,
    },
  });
}
