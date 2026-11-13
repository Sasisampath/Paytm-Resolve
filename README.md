# Paytm Resolve

Independent hackathon prototype by **Team PaytmKaro** (Paytm Build for India AI Hackathon).
**Not an official Paytm product.** All payment data is synthetic demo data.

Phase 1 = splash screen, Merchant Home, bottom navigation, Issues list/detail.
Phase 1B = Check Payment form (amount, approximate time, optional UPI reference, help bottom sheet, disabled "Coming soon" Tamil voice card).
Phase 2 adds simulated payment verification through the Check Payment form. Phase 2.1 adds browser-local issue tracking. Phase 3 adds Sarvam-powered voice input and Tamil audio guidance.

## Run

```bash
npm ci
npm run dev      # http://localhost:3000
npm run lint
npm test
npx tsc --noEmit
npm run build
```

The default build uses Turbopack. The original checkout produced a CSS worker port-binding error in a restricted build environment. A clean `.next` directory and a run with access to local worker sockets and Google Fonts passed with the default configuration. If you encounter this locally, retry from a clean checkout in a shell with that access.

## Sarvam voice setup

1. Add `SARVAM_API_KEY=<your key>` to `.env.local` in the project root. Restart the dev server after setting the key. For a hosted preview, set the same server environment variable in the hosting dashboard.
2. Open **Check Payment** on localhost or HTTPS. Select **Speak in Tamil**, grant microphone access, speak, and select **Stop recording**. Recording stops after 25 seconds if you do not stop it first.
3. Review the transcript and editable fields. Supply missing amount or time before selecting **Check Payment** yourself. The fixed demo date is **13 November 2026**, with times in IST.
4. On the result, select **Listen in Tamil** to load the audio, then use the player to play or pause. Tamil text is available even when speech synthesis fails.

The server uses the official `sarvamai` SDK with `saaras:v4` for transcription, `sarvam-105b` via Chat Completions V2 for structured extraction, and `bulbul:v4-flash` with `gokul_ta_narration` for Tamil speech. Only audio and its transcript are sent for transcription and extraction. Bulbul receives the fixed Tamil text for the result. The app does not store raw recordings or log transcripts. For this demo, speak synthetic details and leave out personal information.

For voice tests, try “Customer rendu aayiram rupees pay pannitaanga, aana confirmation varala.” The amount can fill in and the time stays blank. Enter **09:55** to check the ₹2,000 no-match demo. For the received and pending examples below, say the amount, exact clock time with AM, and the digits after “UPI reference number.” If the transcript omits or mishears a detail, correct it before checking. To verify the fallback, deny microphone access or start the server without the key and use the manual form.

The voice routes apply per-instance demo throttling. Missing credentials, exhausted credits, timeouts, and service errors leave manual entry and the readable guidance available. Extraction checks the model's suggestions against the transcript, so ambiguous or unsupported wording may need manual entry.

[Sarvam JavaScript SDK](https://docs.sarvam.ai/api/getting-started/sdks) · [Tamil voice catalog](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices)

## Structure

- `src/app` — routes: `/`, `/check-payment`, `/check-payment/result`, `/api/payments/verify`, `/issues`, `/issues/[id]`
- `src/components` — `splash`, `layout`, `merchant`, `payments`, `issues`, `check-payment`
- `src/data` — typed synthetic data: `merchant.ts`, `transactions.ts` (confirmed receipts only), `issues.ts` (customer claims)
- `public/assets` — supplied brand assets (wordmark cropped to its content box; others downscaled, transparency kept)
- `src/app/icon.png`, `apple-icon.png` — favicon / app identity from the supplied icon

## Design decisions

- **Payment and case status.** "Received today" sums confirmed payments only. The original cases retain their report status. New cases have their own open or resolved status and show the payment result separately. A screenshot or bank debit cannot confirm receipt, and a missing match cannot establish fraud.
- **Splash.** The supplied wordmark is a single raster, so it is revealed with three aligned `clip-path` layers of the same image (Paytm → Resolve → checkmark), not redrawn. Timeline is pure CSS (1.4 s) so it still plays/hides without JS. `sessionStorage` (`resolve-splash-done`) plus a tiny pre-paint script prevent replay and flash on return visits. `prefers-reduced-motion` shows the static logo briefly.
- **Shell.** Max 480 px centred app shell; fixed bottom nav with iOS safe-area padding.
- **Verification.** The API uses a fixed demo merchant and matches integer paise. A submitted UPI reference must identify a unique record for the merchant, amount, and demo date. Approximate time helps find candidates when no reference is supplied. Results show the record’s observed status time and the time of the check.

## Demo checks

Open `/check-payment`, enter the values below, and select **Check Payment**.

| Amount | Time (IST) | Synthetic UPI reference | Expected result |
| --- | --- | --- | --- |
| ₹2,000 | 09:55 | Leave blank | Payment not verified |
| ₹850 | 09:21 | `990000000850` | Payment pending |
| ₹500 | 09:48 | `990000002006` | Payment received |
| ₹650 | 09:38 | `990000000650` | Payment failed |
| ₹650 | 09:40 | Leave blank | More details needed |
| ₹500 | 09:48 | `990000000503` | Unable to verify |

## Demo issue workflow

1. Check ₹500 at 09:48 IST with the reference blank. Select **Save as Issue** on **More details needed**.
2. Refresh the case detail to see the original check in **Verification history**. The case also appears under **Issues** and **Needs attention** on Home.
3. Enter `990000002006` on the case and select **Recheck Payment**. The new check shows **Payment received**.
4. Select **Close Case**. The case stays in Issues with its history, and Home’s open issue count drops. The verified payment amount is already included in the demo receipts.

## Known limitations

- Checks use synthetic records for 13 November 2026 in IST. Submitted details and the last result are stored in the current browser tab for return and refresh.
- Saved demo cases use browser-local storage for the current site. Other browsers or devices have separate case lists. Clearing site data removes saved cases and history.
- Notification bell is a placeholder; greeting is static ("Good morning").
- Supplied assets are PNG rasters (despite `.svg` extension) with some intrinsic padding; the splash split points are tuned to this exact wordmark and need re-tuning if it changes.
- shadcn/ui and Motion were not added; plain Tailwind + CSS keeps Phase 1 small.
