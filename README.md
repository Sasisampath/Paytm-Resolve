# Paytm Resolve — Phase 1

Independent hackathon prototype by **Team PaytmKaro** (Paytm Build for India AI Hackathon).
**Not an official Paytm product.** All payment data is synthetic demo data.

Phase 1 = splash screen, Merchant Home, bottom navigation, Issues list/detail.
Phase 1B = Check Payment form (amount, approximate time, optional UPI reference, help bottom sheet, disabled "Coming soon" Tamil voice card).
No payment verification and no AI yet.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build
```

## Structure

- `src/app` — routes: `/`, `/check-payment`, `/issues`, `/issues/[id]`
- `src/components` — `splash`, `layout`, `merchant`, `payments`, `issues`, `check-payment`
- `src/data` — typed synthetic data: `merchant.ts`, `transactions.ts` (confirmed receipts only), `issues.ts` (customer claims)
- `public/assets` — supplied brand assets (wordmark cropped to its content box; others downscaled, transparency kept)
- `src/app/icon.png`, `apple-icon.png` — favicon / app identity from the supplied icon

## Design decisions

- **Truthful terminology.** "Received today" sums confirmed payments only. Issues are claims: *Not verified* and *Awaiting status check* (never "pending at provider"). A screenshot or bank debit is not proof of receipt; no match is not proof of fraud.
- **Splash.** The supplied wordmark is a single raster, so it is revealed with three aligned `clip-path` layers of the same image (Paytm → Resolve → checkmark), not redrawn. Timeline is pure CSS (1.4 s) so it still plays/hides without JS. `sessionStorage` (`resolve-splash-done`) plus a tiny pre-paint script prevent replay and flash on return visits. `prefers-reduced-motion` shows the static logo briefly.
- **Shell.** Max 480 px centred app shell; fixed bottom nav with iOS safe-area padding.
- **Future server APIs.** Add route handlers under `src/app/api/*`; keep keys server-side only.

## Known limitations

- Check Payment validates input only; `submitPaymentCheck()` in `src/lib/payment-check.ts` is the Phase 2 seam and currently returns `not_connected`. Nothing is verified and no result is invented.
- Voice input (`VoiceInputCard`) is a disabled placeholder; it requests no microphone permission and produces no transcript.
- Notification bell is a placeholder; greeting is static ("Good morning").
- Supplied assets are PNG rasters (despite `.svg` extension) with some intrinsic padding; the splash split points are tuned to this exact wordmark and need re-tuning if it changes.
- shadcn/ui and Motion were not added; plain Tailwind + CSS keeps Phase 1 small.
