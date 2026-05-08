# Subscription Spend Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first web app that tracks subscriptions, computes monthly/yearly spend, shows upcoming charges, and generates a shareable “annual spend poster” with a Pro paywall.

**Architecture:** Single-page app with local persistence (IndexedDB) and pure functions for spend calculations. A “Share Poster” view renders a deterministic layout and exports to PNG. Pro gating is client-side for MVP (unlock code) and can be swapped to real payments/auth later.

**Tech Stack:** Vite + React + TypeScript, Tailwind CSS, Vitest + React Testing Library, IndexedDB via `idb`, PNG export via `html-to-image`.

---

## File/Module Map

- Create: `package.json` (via scaffold)
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/domain/subscription.ts` (types)
- Create: `src/domain/calc.ts` (monthlyEquivalent, upcoming charges)
- Create: `src/storage/db.ts` (IndexedDB schema + CRUD)
- Create: `src/storage/settings.ts` (Pro flag + settings)
- Create: `src/routes/*` (Home, Subscriptions, AddEdit, Insights, Share, Settings)
- Create: `src/components/*` (form fields, cards, poster)
- Create: `src/share/poster.tsx` (poster layout)
- Create: `src/share/exportPng.ts` (export utility)
- Create: `src/styles.css` (Tailwind)
- Create: `src/test/*` + `vitest.config.ts`

## Task 1: Scaffold Project + Tooling

**Files:**
- Create: (scaffolded) Vite React TS app
- Create: `tailwind.config.*`, `postcss.config.*`, `src/styles.css`
- Modify: `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Scaffold Vite React TS**

Run:

```bash
cd e:/project/money
npx vite-init . --template react-ts
npm install
```

Expected: `package.json` exists and `npm run dev` starts.

- [ ] **Step 2: Add Tailwind + test deps**

Run:

```bash
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install idb html-to-image
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Update `tailwind.config.js` (or `.cjs`) to include:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Update `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 5: Verify**

Run:

```bash
npm run test:run
```

Expected: PASS (0 tests).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold app with tailwind and vitest"
```

## Task 2: Domain Types + Calculation Functions (TDD)

**Files:**
- Create: `src/domain/subscription.ts`
- Create: `src/domain/calc.ts`
- Test: `src/domain/calc.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/domain/calc.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { monthlyEquivalentCents, yearlyEquivalentCents, listUpcomingCharges } from './calc'
import { BillingPeriod, Subscription } from './subscription'

describe('monthlyEquivalentCents', () => {
  it('converts monthly to itself', () => {
    expect(monthlyEquivalentCents({ amountCents: 1299, billingPeriod: 'monthly' })).toBe(1299)
  })

  it('converts yearly to monthly', () => {
    expect(monthlyEquivalentCents({ amountCents: 12000, billingPeriod: 'yearly' })).toBe(1000)
  })

  it('converts weekly to monthly using 52/12', () => {
    expect(monthlyEquivalentCents({ amountCents: 1000, billingPeriod: 'weekly' })).toBe(Math.round(1000 * 52 / 12))
  })

  it('converts custom_days', () => {
    expect(monthlyEquivalentCents({ amountCents: 300, billingPeriod: 'custom_days', customDays: 10 })).toBe(Math.round(300 * 30 / 10))
  })
})

describe('yearlyEquivalentCents', () => {
  it('is monthlyEquivalent * 12', () => {
    expect(yearlyEquivalentCents({ amountCents: 1000, billingPeriod: 'monthly' })).toBe(12000)
  })
})

describe('listUpcomingCharges', () => {
  it('includes a monthly charge within window', () => {
    const sub: Subscription = {
      id: 's1',
      name: 'Test',
      amountCents: 1000,
      currency: 'CNY',
      billingPeriod: 'monthly',
      customDays: null,
      nextChargeDate: '2026-05-10',
      category: 'other',
      paymentMethod: 'other',
      status: 'active',
      notes: '',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    }

    const charges = listUpcomingCharges({
      subscriptions: [sub],
      todayLocalDate: '2026-05-08',
      windowDays: 30,
    })

    expect(charges.map(c => c.localDate)).toContain('2026-05-10')
  })

  it('recurs weekly charges within window', () => {
    const sub: Subscription = {
      id: 's1',
      name: 'Test',
      amountCents: 1000,
      currency: 'CNY',
      billingPeriod: 'weekly',
      customDays: null,
      nextChargeDate: '2026-05-10',
      category: 'other',
      paymentMethod: 'other',
      status: 'active',
      notes: '',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    }

    const charges = listUpcomingCharges({
      subscriptions: [sub],
      todayLocalDate: '2026-05-08',
      windowDays: 20,
    })

    expect(charges.map(c => c.localDate)).toEqual(['2026-05-10', '2026-05-17', '2026-05-24'])
  })

  it('excludes paused subscriptions', () => {
    const sub: Subscription = {
      id: 's1',
      name: 'Test',
      amountCents: 1000,
      currency: 'CNY',
      billingPeriod: 'monthly',
      customDays: null,
      nextChargeDate: '2026-05-10',
      category: 'other',
      paymentMethod: 'other',
      status: 'paused',
      notes: '',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
    }

    const charges = listUpcomingCharges({
      subscriptions: [sub],
      todayLocalDate: '2026-05-08',
      windowDays: 30,
    })

    expect(charges).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests (expect fail)**

Run:

```bash
npm run test:run
```

Expected: FAIL (missing modules).

- [ ] **Step 3: Add domain types**

Create `src/domain/subscription.ts`:

```ts
export type Currency = 'CNY'

export type BillingPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom_days'

export type Category =
  | 'video'
  | 'music'
  | 'cloud'
  | 'tool'
  | 'ai'
  | 'fitness'
  | 'learning'
  | 'other'

export type PaymentMethod = 'alipay' | 'wechat' | 'bank' | 'apple' | 'other'

export type SubscriptionStatus = 'active' | 'paused' | 'canceled'

export type Subscription = {
  id: string
  name: string
  amountCents: number
  currency: Currency
  billingPeriod: BillingPeriod
  customDays: number | null
  nextChargeDate: string
  category: Category
  paymentMethod: PaymentMethod
  status: SubscriptionStatus
  notes: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 4: Implement calculations**

Create `src/domain/calc.ts`:

```ts
import { BillingPeriod, Subscription } from './subscription'

export type MoneyInput = {
  amountCents: number
  billingPeriod: BillingPeriod
  customDays?: number | null
}

export function monthlyEquivalentCents(input: MoneyInput): number {
  if (input.billingPeriod === 'monthly') return input.amountCents
  if (input.billingPeriod === 'yearly') return Math.round(input.amountCents / 12)
  if (input.billingPeriod === 'weekly') return Math.round(input.amountCents * 52 / 12)
  const days = input.customDays ?? 0
  if (!Number.isFinite(days) || days <= 0) throw new Error('customDays must be > 0')
  return Math.round(input.amountCents * 30 / days)
}

export function yearlyEquivalentCents(input: MoneyInput): number {
  return monthlyEquivalentCents(input) * 12
}

export type UpcomingCharge = {
  subscriptionId: string
  name: string
  amountCents: number
  currency: string
  localDate: string
}

function addDaysLocalDate(localDate: string, daysToAdd: number): string {
  const [y, m, d] = localDate.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + daysToAdd)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function compareLocalDate(a: string, b: string): number {
  return a.localeCompare(b)
}

export function listUpcomingCharges(input: {
  subscriptions: Subscription[]
  todayLocalDate: string
  windowDays: number
}): UpcomingCharge[] {
  const endDate = addDaysLocalDate(input.todayLocalDate, input.windowDays)
  const charges: UpcomingCharge[] = []

  for (const sub of input.subscriptions) {
    if (sub.status !== 'active') continue

    if (sub.billingPeriod === 'weekly') {
      let d = sub.nextChargeDate
      while (compareLocalDate(d, endDate) <= 0) {
        if (compareLocalDate(d, input.todayLocalDate) >= 0) {
          charges.push({
            subscriptionId: sub.id,
            name: sub.name,
            amountCents: sub.amountCents,
            currency: sub.currency,
            localDate: d,
          })
        }
        d = addDaysLocalDate(d, 7)
      }
      continue
    }

    if (sub.billingPeriod === 'custom_days') {
      const days = sub.customDays ?? 0
      if (!Number.isFinite(days) || days <= 0) continue
      let d = sub.nextChargeDate
      while (compareLocalDate(d, endDate) <= 0) {
        if (compareLocalDate(d, input.todayLocalDate) >= 0) {
          charges.push({
            subscriptionId: sub.id,
            name: sub.name,
            amountCents: sub.amountCents,
            currency: sub.currency,
            localDate: d,
          })
        }
        d = addDaysLocalDate(d, days)
      }
      continue
    }

    if (compareLocalDate(sub.nextChargeDate, input.todayLocalDate) >= 0 && compareLocalDate(sub.nextChargeDate, endDate) <= 0) {
      charges.push({
        subscriptionId: sub.id,
        name: sub.name,
        amountCents: sub.amountCents,
        currency: sub.currency,
        localDate: sub.nextChargeDate,
      })
    }
  }

  charges.sort((a, b) => compareLocalDate(a.localDate, b.localDate))
  return charges
}
```

- [ ] **Step 5: Run tests (expect pass)**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain
git commit -m "feat: add subscription domain and spend calculations"
```

## Task 3: Local Persistence (IndexedDB) + Settings

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/storage/settings.ts`
- Test: `src/storage/settings.test.ts`

- [ ] **Step 1: Write failing settings test**

Create `src/storage/settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getProStatus, setProStatus } from './settings'

describe('Pro settings', () => {
  it('roundtrips pro flag', () => {
    setProStatus(true)
    expect(getProStatus()).toBe(true)
    setProStatus(false)
    expect(getProStatus()).toBe(false)
  })
})
```

- [ ] **Step 2: Implement settings**

Create `src/storage/settings.ts`:

```ts
const PRO_KEY = 'sst_pro'

export function getProStatus(): boolean {
  return localStorage.getItem(PRO_KEY) === 'true'
}

export function setProStatus(value: boolean): void {
  localStorage.setItem(PRO_KEY, value ? 'true' : 'false')
}
```

- [ ] **Step 3: Implement IndexedDB schema + CRUD**

Create `src/storage/db.ts`:

```ts
import { openDB } from 'idb'
import { Subscription } from '../domain/subscription'

const DB_NAME = 'subscription_spend_tracker'
const DB_VERSION = 1

type DBSchema = {
  subscriptions: {
    key: string
    value: Subscription
    indexes: { 'by_nextChargeDate': string }
  }
}

const dbPromise = openDB<DBSchema>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    const store = db.createObjectStore('subscriptions', { keyPath: 'id' })
    store.createIndex('by_nextChargeDate', 'nextChargeDate')
  },
})

export async function listSubscriptions(): Promise<Subscription[]> {
  const db = await dbPromise
  return db.getAll('subscriptions')
}

export async function getSubscription(id: string): Promise<Subscription | undefined> {
  const db = await dbPromise
  return db.get('subscriptions', id)
}

export async function upsertSubscription(sub: Subscription): Promise<void> {
  const db = await dbPromise
  await db.put('subscriptions', sub)
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('subscriptions', id)
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage
git commit -m "feat: add local settings and indexeddb persistence"
```

## Task 4: Basic UI Shell + Routing

**Files:**
- Create: `src/routes/Home.tsx`
- Create: `src/routes/Subscriptions.tsx`
- Create: `src/routes/AddEdit.tsx`
- Create: `src/routes/Insights.tsx`
- Create: `src/routes/Share.tsx`
- Create: `src/routes/Settings.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install router**

Run:

```bash
npm install react-router-dom
```

- [ ] **Step 2: App shell**

Update `src/App.tsx`:

```tsx
import { Link, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import Subscriptions from './routes/Subscriptions'
import AddEdit from './routes/AddEdit'
import Insights from './routes/Insights'
import Share from './routes/Share'
import Settings from './routes/Settings'

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold">Subscription Tracker</Link>
          <nav className="flex gap-3 text-sm">
            <Link to="/subs" className="text-neutral-700 hover:text-neutral-950">订阅</Link>
            <Link to="/insights" className="text-neutral-700 hover:text-neutral-950">统计</Link>
            <Link to="/share" className="text-neutral-700 hover:text-neutral-950">海报</Link>
            <Link to="/settings" className="text-neutral-700 hover:text-neutral-950">设置</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subs" element={<Subscriptions />} />
          <Route path="/subs/new" element={<AddEdit />} />
          <Route path="/subs/:id" element={<AddEdit />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/share" element={<Share />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
```

Update `src/main.tsx` to wrap router:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 3: Create placeholder route components**

Create each route file with a minimal heading and one CTA.

Example `src/routes/Home.tsx`:

```tsx
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">总览</h1>
      <Link to="/subs/new" className="inline-flex rounded-md bg-neutral-900 px-3 py-2 text-sm text-white">新增订阅</Link>
    </div>
  )
}
```

- [ ] **Step 4: Verify navigation**

Run:

```bash
npm run dev
```

Expected: Routes render without errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx src/routes
git commit -m "feat: add app shell and routes"
```

## Task 5: Subscription CRUD UI (List + Add/Edit)

**Files:**
- Modify: `src/routes/Subscriptions.tsx`, `src/routes/AddEdit.tsx`
- Create: `src/components/SubscriptionForm.tsx`
- Create: `src/components/Field.tsx`
- Test: `src/routes/AddEdit.test.tsx`

- [ ] **Step 1: Write failing UI test**

Create `src/routes/AddEdit.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AddEdit from './AddEdit'

vi.mock('../storage/db', async () => {
  return {
    upsertSubscription: vi.fn(async () => undefined),
    getSubscription: vi.fn(async () => undefined),
  }
})

describe('AddEdit', () => {
  it('creates a subscription', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/subs/new']}>
        <Routes>
          <Route path="/subs/new" element={<AddEdit />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('名称'), 'Netflix')
    await user.type(screen.getByLabelText('金额(元)'), '25')
    await user.selectOptions(screen.getByLabelText('周期'), 'monthly')
    await user.type(screen.getByLabelText('下次扣费日'), '2026-05-10')
    await user.click(screen.getByRole('button', { name: '保存' }))

    expect(screen.getByText('已保存')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Implement shared fields**

Create `src/components/Field.tsx`:

```tsx
import { ReactNode } from 'react'

export default function Field(props: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm text-neutral-700">{props.label}</div>
      {props.children}
    </label>
  )
}
```

Create `src/components/SubscriptionForm.tsx`:

```tsx
import Field from './Field'
import { Category, PaymentMethod } from '../domain/subscription'

export type SubscriptionDraft = {
  name: string
  amountYuan: string
  billingPeriod: 'weekly' | 'monthly' | 'yearly' | 'custom_days'
  customDays: string
  nextChargeDate: string
  category: Category
  paymentMethod: PaymentMethod
  notes: string
}

export default function SubscriptionForm(props: {
  value: SubscriptionDraft
  onChange: (next: SubscriptionDraft) => void
}) {
  const v = props.value
  return (
    <div className="space-y-4">
      <Field label="名称">
        <input className="w-full rounded-md border px-3 py-2" value={v.name} onChange={e => props.onChange({ ...v, name: e.target.value })} />
      </Field>

      <Field label="金额(元)">
        <input inputMode="decimal" className="w-full rounded-md border px-3 py-2" value={v.amountYuan} onChange={e => props.onChange({ ...v, amountYuan: e.target.value })} />
      </Field>

      <Field label="周期">
        <select className="w-full rounded-md border px-3 py-2" value={v.billingPeriod} onChange={e => props.onChange({ ...v, billingPeriod: e.target.value as any })}>
          <option value="monthly">每月</option>
          <option value="yearly">每年</option>
          <option value="weekly">每周</option>
          <option value="custom_days">自定义天数</option>
        </select>
      </Field>

      {v.billingPeriod === 'custom_days' ? (
        <Field label="自定义(天)">
          <input inputMode="numeric" className="w-full rounded-md border px-3 py-2" value={v.customDays} onChange={e => props.onChange({ ...v, customDays: e.target.value })} />
        </Field>
      ) : null}

      <Field label="下次扣费日">
        <input type="date" className="w-full rounded-md border px-3 py-2" value={v.nextChargeDate} onChange={e => props.onChange({ ...v, nextChargeDate: e.target.value })} />
      </Field>

      <Field label="类别">
        <select className="w-full rounded-md border px-3 py-2" value={v.category} onChange={e => props.onChange({ ...v, category: e.target.value as any })}>
          <option value="video">视频</option>
          <option value="music">音乐</option>
          <option value="cloud">网盘</option>
          <option value="tool">工具</option>
          <option value="ai">AI</option>
          <option value="fitness">健身</option>
          <option value="learning">学习</option>
          <option value="other">其他</option>
        </select>
      </Field>

      <Field label="支付方式">
        <select className="w-full rounded-md border px-3 py-2" value={v.paymentMethod} onChange={e => props.onChange({ ...v, paymentMethod: e.target.value as any })}>
          <option value="alipay">支付宝</option>
          <option value="wechat">微信</option>
          <option value="bank">银行卡</option>
          <option value="apple">Apple</option>
          <option value="other">其他</option>
        </select>
      </Field>

      <Field label="备注">
        <input className="w-full rounded-md border px-3 py-2" value={v.notes} onChange={e => props.onChange({ ...v, notes: e.target.value })} />
      </Field>
    </div>
  )
}
```

- [ ] **Step 3: Implement Add/Edit route**

Update `src/routes/AddEdit.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import SubscriptionForm, { SubscriptionDraft } from '../components/SubscriptionForm'
import { getSubscription, upsertSubscription } from '../storage/db'
import { Subscription } from '../domain/subscription'

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  return crypto.randomUUID()
}

function yuanToCents(input: string): number {
  const n = Number(input)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

export default function AddEdit() {
  const params = useParams()
  const id = params.id
  const isEdit = Boolean(id)
  const [statusText, setStatusText] = useState('')
  const [draft, setDraft] = useState<SubscriptionDraft>({
    name: '',
    amountYuan: '',
    billingPeriod: 'monthly',
    customDays: '',
    nextChargeDate: '',
    category: 'other',
    paymentMethod: 'other',
    notes: '',
  })

  useEffect(() => {
    if (!id) return
    getSubscription(id).then(sub => {
      if (!sub) return
      setDraft({
        name: sub.name,
        amountYuan: String(sub.amountCents / 100),
        billingPeriod: sub.billingPeriod,
        customDays: sub.customDays ? String(sub.customDays) : '',
        nextChargeDate: sub.nextChargeDate,
        category: sub.category,
        paymentMethod: sub.paymentMethod,
        notes: sub.notes,
      })
    })
  }, [id])

  const canSave = useMemo(() => {
    if (!draft.name.trim()) return false
    if (!draft.nextChargeDate) return false
    if (!draft.amountYuan.trim()) return false
    if (draft.billingPeriod === 'custom_days') {
      const d = Number(draft.customDays)
      if (!Number.isFinite(d) || d <= 0) return false
    }
    return true
  }, [draft])

  async function onSave() {
    setStatusText('')
    const amountCents = yuanToCents(draft.amountYuan)
    const customDays = draft.billingPeriod === 'custom_days' ? Number(draft.customDays) : null
    const now = nowIso()
    const sub: Subscription = {
      id: id ?? newId(),
      name: draft.name.trim(),
      amountCents,
      currency: 'CNY',
      billingPeriod: draft.billingPeriod,
      customDays,
      nextChargeDate: draft.nextChargeDate,
      category: draft.category,
      paymentMethod: draft.paymentMethod,
      status: 'active',
      notes: draft.notes,
      createdAt: now,
      updatedAt: now,
    }
    await upsertSubscription(sub)
    setStatusText('已保存')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? '编辑订阅' : '新增订阅'}</h1>
        <button disabled={!canSave} onClick={onSave} className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50">保存</button>
      </div>
      <SubscriptionForm value={draft} onChange={setDraft} />
      {statusText ? <div className="text-sm text-green-700">{statusText}</div> : null}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 5: Implement list page (manual QA)**

Update `src/routes/Subscriptions.tsx` to load from `listSubscriptions()` and show a list with edit links.

- [ ] **Step 6: Commit**

```bash
git add src/routes src/components
git commit -m "feat: add subscription create/edit and list UI"
```

## Task 6: Home Dashboard (Totals + Upcoming + Progress)

**Files:**
- Modify: `src/routes/Home.tsx`
- Create: `src/components/Money.tsx`

- [ ] **Step 1: Implement Money formatting**

Create `src/components/Money.tsx`:

```tsx
export default function Money(props: { cents: number }) {
  const yuan = (props.cents / 100).toFixed(2)
  return <span>{yuan}</span>
}
```

- [ ] **Step 2: Implement Home data loading + totals**

Update `src/routes/Home.tsx` to:

- load subscriptions
- compute `FixedMonthlyTotal` using `monthlyEquivalentCents`
- compute upcoming charges using `listUpcomingCharges` with `todayLocalDate`
- show progress bar `min(subCount, 3)/3`

- [ ] **Step 3: Manual QA**

Run:

```bash
npm run dev
```

Expected: totals update after adding subscriptions.

- [ ] **Step 4: Commit**

```bash
git add src/routes/Home.tsx src/components/Money.tsx
git commit -m "feat: add dashboard totals and upcoming charges"
```

## Task 7: Share Poster + PNG Export + Pro Gating

**Files:**
- Create: `src/share/poster.tsx`
- Create: `src/share/exportPng.ts`
- Modify: `src/routes/Share.tsx`
- Modify: `src/routes/Settings.tsx`

- [ ] **Step 1: Implement poster layout component**

Create `src/share/poster.tsx`:

```tsx
import Money from '../components/Money'

export type PosterModel = {
  annualTotalCents: number
  monthlyAvgCents: number
  subCount: number
  nextMonthChargesCents: number
  top3: { name: string; amountCents: number }[]
  brandText: string
}

export default function Poster(props: { model: PosterModel }) {
  const m = props.model
  return (
    <div className="w-[360px] rounded-2xl bg-white p-5 text-neutral-900 shadow">
      <div className="text-sm text-neutral-500">年度订阅账单</div>
      <div className="mt-2 text-2xl font-semibold">
        我一年在会员上花了 ¥<Money cents={m.annualTotalCents} />
      </div>
      <div className="mt-1 text-sm text-neutral-600">平均每月 ¥<Money cents={m.monthlyAvgCents} />｜订阅数 {m.subCount}</div>

      <div className="mt-4 rounded-xl bg-neutral-50 p-4">
        <div className="text-sm font-medium">Top 订阅</div>
        <div className="mt-2 space-y-2">
          {m.top3.map(item => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="truncate pr-2">{item.name}</div>
              <div className="shrink-0">¥<Money cents={item.amountCents} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border p-4">
        <div className="text-sm text-neutral-600">下个月将扣费</div>
        <div className="text-sm font-semibold">¥<Money cents={m.nextMonthChargesCents} /></div>
      </div>

      <div className="mt-4 text-xs text-neutral-500">按当前订阅估算｜不含一次性消费</div>
      <div className="mt-2 text-[10px] text-neutral-400">{m.brandText}</div>
    </div>
  )
}
```

- [ ] **Step 2: Implement PNG export utility**

Create `src/share/exportPng.ts`:

```ts
import { toPng } from 'html-to-image'

export async function exportNodeToPng(node: HTMLElement): Promise<string> {
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
  })
}
```

- [ ] **Step 3: Implement Share route (with Pro gate)**

Update `src/routes/Share.tsx` to:

- load subscriptions
- compute annual total, monthly avg, top3, next month charges
- render poster in a `ref`
- “下载海报” button:
  - free: export but add watermark overlay (implement by rendering `brandText` stronger)
  - pro: export clean

- [ ] **Step 4: Add Settings Pro unlock (MVP unlock code)**

Update `src/routes/Settings.tsx` to include:

- current Pro status
- input “解锁码”
- if code matches `EARLYBIRD-2026`, set Pro true

- [ ] **Step 5: Manual QA**

Expected:

- Free exports with visible brand text
- Pro exports without watermark

- [ ] **Step 6: Commit**

```bash
git add src/routes/Share.tsx src/routes/Settings.tsx src/share
git commit -m "feat: add share poster export and pro gating"
```

## Task 8: ICS Export (Calendar Reminder)

**Files:**
- Create: `src/reminders/ics.ts`
- Modify: `src/routes/Home.tsx` or `src/routes/Subscriptions.tsx`

- [ ] **Step 1: Implement ICS builder**

Create `src/reminders/ics.ts`:

```ts
import { Subscription } from '../domain/subscription'

function dtstamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function dateToIcs(localDate: string): string {
  return localDate.replaceAll('-', '')
}

export function buildIcs(subs: Subscription[]): string {
  const stamp = dtstamp()
  const events = subs
    .filter(s => s.status === 'active')
    .map(s => {
      const uid = `${s.id}@subscription-tracker`
      const start = dateToIcs(s.nextChargeDate)
      const summary = `${s.name} 扣费提醒`
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `SUMMARY:${summary}`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Subscription Tracker//EN',
    events,
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Wire a button**

Add a button “导出日历(ICS)” on Home that downloads `subscriptions.ics`.

- [ ] **Step 3: Manual QA**

Import ICS into calendar and confirm events appear.

- [ ] **Step 4: Commit**

```bash
git add src/reminders src/routes/Home.tsx
git commit -m "feat: add ics calendar export"
```

## Self-Review (Plan Quality)

- Spec coverage:
  - MVP features: CRUD, totals, upcoming charges, share poster, Pro gating, ICS export are covered by Tasks 5–8.
  - Data model & calculations: Task 2.
  - Local-first persistence: Task 3.
  - Small reductions vs spec: Email push + true payment automation deferred; MVP uses unlock code.
- Placeholder scan: No TBD/TODO used.
- Consistency: Type names and file paths are consistent across tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-08-subscription-spend-tracker-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

