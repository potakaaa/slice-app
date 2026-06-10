# Startup Crash Fix — SLICE (com.slice.debtresolution)

**Created:** 2026-06-10
**Status:** Active
**Type:** Bug fix / diagnosis (SIMPLE-but-empirical, bisection-driven)
**Owner:** orchestrator (direct), with vc-debugger available if needed

---

## Problem

Production / TestFlight builds (build 3, v1.0.0) crash instantly on launch — no
splash screen. Two crash logs analyzed:

- `docs/crash_logs/Slice-2026-06-10-111354.ips`
- `docs/crash_logs/Slice-2026-06-10-113027.ips`

Both built with `newArchEnabled: true` and (at build 3 time) `reactCompiler: true`.

## Root-cause analysis (from crash logs)

**Signature (identical across both logs):**

- Triggered thread = `com.facebook.react.runtime.JavaScript`.
- Crash frame = `hermes::vm::GCScope::_newChunkAndPHV` — Hermes GC handle-scope
  allocation. `EXC_BAD_ACCESS` reading offset `0x98` off a null/garbage pointer.
- Crash *site varies*: log 1 in `StringPrimitive::slice` (`String.prototype.split`),
  log 2 in `JSObject::addOwnPropertyImpl`.
- Concurrent `com.meta.react.turbomodulemanager.queue` thread is inside
  `ObjCTurboModule::performVoidMethodInvocation` → `convertNSExceptionToJSError`
  → `backtrace_symbols`/`dladdr` in BOTH logs.

**Conclusions:**

1. The Hermes GC crash is the **victim of native heap corruption**, not the cause.
   A real JS `throw` is deterministic (same frame, clean RCTFatal). A GC that dies
   at a *different* allocation each run = heap corruption.
2. The **corruptor is on the ObjC TurboModule path**: a `void` TurboModule method
   threw an NSException at startup, and New-Architecture error marshaling
   (`convertNSExceptionToJSError`, which walks the native backtrace) ran
   concurrently with and corrupted the Hermes heap.
3. Release/device-only: pointer-auth (PAC) failure pattern → only reproduces on
   real arm64e hardware, NOT the simulator. New Arch + Hermes + a TurboModule
   exception is the trigger class.

**Gap:** the NSException reason (which names the module) is never logged — the
conversion path crashes first, and `lib/crashReporting.ts` is a console-only stub.
We are blind to the actual error text until we add visibility.

**2026-06-10 update from `Slice-2026-06-10-132912.ips`:**

- The third crash terminates directly with `SIGABRT` on
  `com.meta.react.turbomodulemanager.queue` while
  `ObjCTurboModule::performVoidMethodInvocation` rethrows an Objective-C
  exception. This confirms the TurboModule exception is the primary failure;
  the earlier Hermes crashes were secondary failures in exception conversion.
- RevenueCat had a preview-only startup path: Expo Go skipped it because
  `executionEnvironment === "storeClient"`, while standalone preview builds
  called `Purchases.setLogLevel()` and `Purchases.configure()` as soon as a
  persisted Supabase session loaded.
- RevenueCat issue
  [#1712](https://github.com/RevenueCat/react-native-purchases/issues/1712)
  tracks the same iOS 26 + New Architecture + TurboModule launch-crash
  signature. Related issue
  [#1776](https://github.com/RevenueCat/react-native-purchases/issues/1776)
  confirms React Native 0.81's exception conversion can turn a native module
  exception into Hermes corruption. This app's `LOG_LEVEL.WARN` resolves to the
  expected `"WARN"` string, so it does not have #1776's numeric log-level bug.
- Mitigation implemented but not yet device-verified: RevenueCat no longer
  configures during root startup, public SDK keys are validated before entering
  the native bridge, and initialization occurs when the pricing flow is opened.

**2026-06-10 update from `Slice-2026-06-10-134618.ips`:**

- The app binary UUID changed from `8d679fa9-...` to `c459c848-...`, proving the
  RevenueCat mitigation was included in the tested preview build.
- The crash still occurred 218 ms after launch with the same
  `performVoidMethodInvocation` → `convertNSExceptionToJSError` → Hermes
  corruption path. RevenueCat was therefore not the only startup trigger.
- `GestureHandlerRootView` was found to call
  `RNGestureHandlerModule.install()` synchronously on its first Fabric render.
  This is an eager void TurboModule call and exactly matches the failing path.
- The next isolation build removes `GestureHandlerRootView`,
  `react-native-gesture-handler`, `KeyboardProvider`,
  `react-native-keyboard-controller`, and explicit
  `SplashScreen.preventAutoHideAsync()` / `hideAsync()` calls. A clean prebuild
  and `pod install` confirmed neither gesture-handler nor keyboard-controller is
  present in the iOS autolinking graph.

**2026-06-10 update from `Slice-2026-06-10-140118.ips`:**

- Binary UUID `26674a4a-...` proves the gesture-handler,
  keyboard-controller, and splash-call removals were included.
- The same native exception conversion remained:
  `performVoidMethodInvocation` → `convertNSExceptionToJSError`, concurrently
  corrupting Hermes while the JS thread was in `arrayPrototypeSome`.
- The first route rendered `SkeletonScreen`, which imported Reanimated 4 and
  initialized Worklets on the first production render. Reanimated 4 also
  prevented disabling the New Architecture.
- Architecture-level mitigation implemented: the two Reanimated animations
  now use React Native `Animated`; Reanimated and Worklets are removed; and
  `newArchEnabled` is false. Generated `Podfile.properties.json` sets
  `RCT_NEW_ARCH_ENABLED=0`, and CocoaPods reports "Configuring the target with
  the Legacy Architecture."

**2026-06-10 EAS build `57f297b1-9309-4d77-ac99-0216f456f62b`:**

- The legacy-architecture build reached Xcode compilation, but
  `expo-glass-effect` failed because its Fabric component views override
  `mountChildComponentView` / `unmountChildComponentView`, which do not exist
  on the legacy superclass.
- The package was only used to select Expo Router's experimental native tabs.
  That optional branch and dependency were removed; the existing classic
  blurred tab bar remains.
- A clean prebuild and pod installation now succeed with no
  `ExpoGlassEffect`, Reanimated, or Worklets pod. TypeScript, 30 tests, and the
  production iOS bundle export pass.

**2026-06-10 ROOT CAUSE CONFIRMED — env vars not inlined (supersedes the New-Arch theory):**

- The real defect was **how public env vars were read**, not the New Architecture.
  `lib/supabase.ts` used computed access (`process["env"]["EXPO_PUBLIC_SUPABASE_URL"]`).
  Expo's Babel transform only statically inlines `process.env.EXPO_PUBLIC_*` when
  accessed via **direct dotted member access**; computed/bracket access is never
  replaced, so the production bundle saw `undefined` config.
- Undefined Supabase/RevenueCat config → a `void` TurboModule threw an NSException
  at launch → New-Arch exception conversion corrupted the Hermes heap. That is the
  exact crash signature analyzed above. **Env-not-inlined = root cause; New Arch =
  amplifier.** Disabling New Arch (B4) and removing `expo-glass-effect` were
  collateral mitigations for a crash they did not cause.
- **Fix shipped (in tree, uncommitted):** `supabase.ts` and `revenueCat.tsx` now use
  dotted `process.env.EXPO_PUBLIC_*`; `grep process[` finds no remaining computed
  reads in runtime code (`app.config.js` keeps `process["env"]` — build-time Node,
  never bundled). `eas.json` `preview`/`production` now set
  `"environment": "production"` so EAS injects the secrets at build time.

### Restoration sequence (incremental — one variable per device build)

Because `expo-glass-effect` is Fabric-only and requires New Architecture, restore in
two device-verified stages rather than reverting everything at once:

- [ ] **R1. New Architecture back ON, classic blur tab bar kept.**
      `newArchEnabled: true` (DONE in tree). No `expo-glass-effect` yet. Build
      Release on device. Clean launch proves both the env fix and New Arch are safe.
      (`reactCompiler` left `false` — separate optimization, not needed for R2.)
- [x] **R2 (code).** Re-added `expo-glass-effect` (`~0.1.4` → resolved 0.1.10) and
      restored the `NativeTabLayout` / `isLiquidGlassAvailable()` branch in
      `app/(tabs)/_layout.tsx`. `pnpm install`, TypeScript, `expo install --check`,
      and 30 tests all pass.
- [ ] **R2 (device).** Clean prebuild + device Release build; confirm the glass tab
      bar renders (Fabric `ExpoGlassEffect` now compiles because New Arch is on) and
      launch is clean. This is the build that previously failed under legacy arch.

---

## Fix plan (ordered; stop as soon as a build launches clean)

> **Reproduction rule:** validate on a **real device** Release build
> (`npx expo run:ios --configuration Release --device`), not the simulator —
> the simulator will likely give a false "fixed" because PAC/heap corruption is
> arm64e-only. Capture logs concurrently with Console.app or
> `idevicesyslog | grep -iE "slice|hermes|exception|fatal|turbomodule"`.

### Track A — Get visibility (do FIRST, cheap, no rebuild gamble)

- [ ] **A1. Capture the live error during launch.** Run a local Release build on
      the device with `idevicesyslog` / Console.app attached. The NSException
      `reason` printed before the crash names the throwing module. This may make
      the rest of the bisection unnecessary.
- [ ] **A2. (Optional but high-value) Wire real native crash reporting** so future
      TestFlight crashes are legible: `npx expo install @sentry/react-native`,
      then fill `initCrashReporting`/`reportError` in `lib/crashReporting.ts`
      (Sentry captures the native NSException + JS error automatically). Defer if
      A1 already reveals the cause.

### Track B — Bisect the mechanism (cheapest / highest-probability first)

Each step = one config change → rebuild on device → test. Revert if no effect.

> **B2 (New Arch OFF) is BLOCKED.** Reanimated 4.x hard-asserts New Architecture
> in its podspec (`assert_new_architecture_enabled`); `newArchEnabled:false`
> fails `pod install`. Disabling New Arch would require downgrading to Reanimated
> 3.x — treat that as a heavier fallback (B4), not the first move.
>
> **Version drift RULED OUT:** `npx expo install --check` → "Dependencies are up
> to date". Reanimated 4.1.7 / worklets 0.5.1 are the SDK-54-blessed versions, so
> this is not a simple version mismatch. Reanimated/worklets remains the top
> *runtime* suspect (most JSI-invasive startup module; forces New Arch on).

- [ ] **B1. React Compiler OFF** — ALREADY DONE in `app.config.js`
      (`experiments.reactCompiler: false`) but NOT yet compiled into a binary.
      Rebuild on device and test. Combine with A1 (log capture) in one build.
- [ ] **B3. (Keeping New Arch) Isolate the throwing module** by temporarily
      removing startup providers one at a time in `app/_layout.tsx`, rebuilding
      between each, in this order (most JSI-invasive first):
      1. `KeyboardProvider` (keyboard-controller)
      2. `GestureHandlerRootView`
      3. `RevenueCatProvider`
      4. reanimated/worklets usage on the first screen
      5. `SplashScreen.preventAutoHideAsync()` (move out of module top-level)
      The provider whose removal stops the crash is the corruptor → upgrade/patch
      or report upstream.
      - [x] RevenueCat preview-only startup call identified and deferred out of
            root startup; the next build still crashed.
      - [x] Keyboard-controller and gesture-handler startup providers removed;
            generated iOS Pods confirm both native modules are absent. Pending
            real-device preview verification.
- [x] **B4. Remove Reanimated/Worklets + `newArchEnabled:false`.**
      The app only used Reanimated for a skeleton pulse and celebration
      overlay, both now implemented with core `Animated`. Removed the
      Fabric-only `expo-glass-effect` native-tab branch so the legacy
      architecture compiles.

### Track C — Hygiene (do regardless, before next EAS submit)

- [x] **C1. Clean native rebuild** to rule out stale Pods/derived data:
      `rm -rf ios/Pods ios/build && npx expo prebuild --clean -p ios` (or
      `pod install` fresh), since prebuilt-binary mismatches can also corrupt JSI.
- [ ] **C2. Confirm fix on device Release, THEN one EAS preview build** (not
      production) to validate the same artifact path before TestFlight.
- [ ] **C3. Commit config changes** (app.config.js, eas.json, app.json,
      package.json) once verified.

---

## Verification / exit criteria

- App launches past splash to first screen on a **device Release** build.
- No `EXC_BAD_ACCESS` in Hermes GC; no `convertNSExceptionToJSError` on the
  TurboModule queue in device logs at startup.
- One clean EAS **preview** build installs and launches before resubmitting to
  TestFlight.

## Resume handoff

- Current edit already in tree: `reactCompiler: false` (B1, uncompiled).
- Next action if continuing cold: run **A1** (device Release + log capture). If
  logs are inaccessible, jump to **B2** (newArchEnabled:false) as the single
  highest-probability fix and rebuild on device.
- Do NOT validate on simulator — false negatives on PAC/heap-corruption crashes.
