# Offline-First PWA Implementation

This document describes the offline-first architecture implemented for Expense.OS.

## Overview

The app now supports:

- ✅ **PWA Installation** - Installable on mobile devices (Add to Home Screen)
- ✅ **Offline Data Access** - View expenses even without internet
- ✅ **Offline CRUD** - Add, edit, and delete expenses while offline
- ✅ **Automatic Sync** - Changes sync automatically when back online
- ✅ **Sync Status UI** - Visual indicator showing online/offline and pending changes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Components                         │
│                    (useOfflineExpenses hook)                     │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Sync Service                              │
│              (handles online/offline transitions)                │
└─────────────────────────────────────────────────────────────────┘
             ↓                                    ↓
┌─────────────────────┐              ┌─────────────────────────────┐
│   IndexedDB (Dexie) │              │      Supabase API            │
│   - expenses        │   ←─sync─→   │      /api/expenses           │
│   - syncQueue       │              │                              │
└─────────────────────┘              └─────────────────────────────┘
```

## Files Created

### Core Offline Module (`lib/offline/`)

| File | Purpose |
|------|---------|
| `db.ts` | Dexie database schema for IndexedDB storage |
| `networkStatus.ts` | Online/offline detection with event subscriptions |
| `syncQueue.ts` | Queue management for offline operations |
| `syncService.ts` | Bidirectional sync logic with conflict handling |
| `index.ts` | Barrel exports |

### React Hooks (`hooks/`)

| File | Purpose |
|------|---------|
| `useOfflineExpenses.ts` | Main hook for offline-aware expense CRUD |
| `useNetworkStatus.ts` | Simple online/offline status hook |
| `useSyncStatus.ts` | Sync status (pending count, syncing, errors) |

### UI Components

| File | Purpose |
|------|---------|
| `components/ui/SyncStatusIndicator.tsx` | Visual sync status badge |
| `components/providers/OfflineProvider.tsx` | App-wide offline context |

### PWA Files (`public/`)

| File | Purpose |
|------|---------|
| `manifest.json` | PWA manifest for installation |
| `sw.js` | Service Worker for caching |
| `icons/` | App icons directory |

## Usage Examples

### Basic Usage - Reading Expenses

```tsx
'use client';

import { useOfflineExpenses } from '@/hooks';

export function ExpenseList() {
  const { expenses, isLoading, isOnline } = useOfflineExpenses();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {!isOnline && <div className="warning">You are offline</div>}
      {expenses.map(expense => (
        <div key={expense.id}>{expense.item} - ${expense.value}</div>
      ))}
    </div>
  );
}
```

### Adding an Expense (works offline!)

```tsx
const { addExpense } = useOfflineExpenses();

const handleAdd = async () => {
  const localId = await addExpense({
    year: 2026,
    month: 2,
    date: '2026-02-01',
    target: 'Living',
    category: 'Food',
    value: 25.50,
    item: 'Lunch',
  });
  
  console.log('Created with local ID:', localId);
  // Will sync to server automatically when online
};
```

### Updating an Expense

```tsx
const { updateExpense } = useOfflineExpenses();

const handleUpdate = async (id: string) => {
  await updateExpense(id, {
    value: 30.00,
    item: 'Dinner',
  });
};
```

### Deleting an Expense

```tsx
const { deleteExpense } = useOfflineExpenses();

const handleDelete = async (id: string) => {
  await deleteExpense(id);
};
```

### Showing Sync Status

```tsx
import { SyncStatusIndicator } from '@/components/ui';

// In your header or navbar:
<SyncStatusIndicator compact />

// Or with full text:
<SyncStatusIndicator />
```

### Using Filters

```tsx
const { expenses } = useOfflineExpenses({
  year: 2026,
  month: 2,
  target: 'Living',
});
```

## How Sync Works

1. **When Online:**
   - Data is written to both IndexedDB and sent to the server
   - Changes sync immediately

2. **When Offline:**
   - Data is written only to IndexedDB
   - Operations are queued in `syncQueue`

3. **When Coming Back Online:**
   - Network status change triggers sync
   - Queued operations are processed in order
   - Conflicts are resolved (server wins for synced items)

## PWA Installation

On mobile devices, users can:

1. Open the app in their browser
2. Tap the browser menu
3. Select "Add to Home Screen" / "Install"
4. The app appears like a native app

## Icons

You need to generate PWA icons in various sizes. Place them in `public/icons/`:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

You can use tools like [Real Favicon Generator](https://realfavicongenerator.net/) to create these from a single source image.

## Next Steps

1. **Generate proper app icons** - Replace the placeholder SVG
2. **Integrate with existing components** - Replace direct API calls with `useOfflineExpenses`
3. **Add offline indicator to UI** - Show when user is offline
4. **Test offline scenarios** - Use Chrome DevTools → Network → Offline

## Testing Offline Mode

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Offline"
4. Try adding an expense - it should work!
5. Uncheck "Offline"
6. The expense should sync to the server
