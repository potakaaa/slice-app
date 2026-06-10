---
name: Zustand v5 + persist infinite loop fixes
description: Two bugs that cause "Maximum update depth" / "getSnapshot should be cached" crashes in Zustand v5 with React Native / Expo StrictMode
---

## Rules

### Rule 1 — Never use object selectors in useAppStore calls
`useAppStore((s) => ({ a: s.a, b: s.b }))` creates a new object on every render. In Zustand v5 (useSyncExternalStore), this means the snapshot is always "different", causing an infinite re-render loop.

**Fix:** Always use individual selectors per value:
```typescript
const profile = useAppStore((s) => s.profile);
const addCreditor = useAppStore((s) => s.addCreditor);
```

**Why:** Zustand v5 uses React's `useSyncExternalStore`. It compares snapshots with `Object.is`. A freshly-created `{}` always fails `Object.is`, so every store update (or even hydration) triggers an infinite render loop.

### Rule 2 — Use skipHydration + manual rehydrate in Expo/RN with persist
The persist middleware's `onRehydrateStorage` calls `setState` synchronously during module initialization. In React StrictMode (Expo dev), `useSyncExternalStore` calls `getSnapshot` twice — if the store changed between those two calls, React throws "getSnapshot should be cached".

**Fix:**
In the store, add `skipHydration: true` to persist options.
In `app/index.tsx`, add:
```typescript
useEffect(() => { useAppStore.persist.rehydrate(); }, []);
```

**Why:** This defers hydration to after first render (inside useEffect), so the store state is stable during any render cycle. React StrictMode can call getSnapshot multiple times without seeing inconsistency.

**How to apply:** Any new Expo/RN project using `zustand/persist` + AsyncStorage should use this pattern by default.
