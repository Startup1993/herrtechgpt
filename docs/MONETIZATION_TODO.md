# Monetization — Offene Punkte für zukünftige Iterationen

Lebende Doku. Jedes Item = ein möglicher PR. Nach Bedarf reaktivieren und in einen separaten Chat mitnehmen.

## 🔴 Vor Live-Schaltung zwingend

### Stripe Live-Mode-Rollout
Aktuell läuft alles im Stripe Test-Mode. Für Production:
- `npm run stripe:seed` mit `sk_live_xxx` in `.env.local` → Live-Produkte anlegen
- Neuer Webhook-Endpoint in Stripe (Live-Mode): `https://world.herr.tech/api/webhooks/stripe`
- Live-Keys in Vercel **Production**-Environment:
  - `STRIPE_SECRET_KEY=sk_live_xxx`
  - `STRIPE_WEBHOOK_SECRET=whsec_xxx` (Live)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx`
- Stripe → Settings → Billing → Customer Portal → in Live-Mode aktivieren
  (Kündigung deaktiviert lassen, wir haben eigenen Button)
- Optional: `STRIPE_AUTOMATIC_TAX=true` setzen **erst wenn Stripe Tax komplett konfiguriert**
  (Firmenadresse, Tax-Registrations, Origin Country)
- Live-Produkt-IDs im Admin-UI eintragen (`/admin/monetization/plans` + `/credits`)

### Stripe Tax vollständig einrichten
Einstellungen → Tax → alle EU-Länder die relevant sind als Tax-Registration hinterlegen
→ dann `STRIPE_AUTOMATIC_TAX=true` setzen.

## 🟡 Wichtig, aber nicht Day-1-Blocker

### Community-Sync von Skool
Aktuell: Admin setzt `access_tier='premium'` manuell in Supabase.
Ziel: Skool → Zapier → Supabase-Webhook, der `profiles.access_tier` setzt.

### Alumni-Downgrade-Automation
Wenn User von `premium` → `alumni` wechselt (Skool-Kündigung synct), soll:
1. Aktives Abo mit `cancel_at_period_end=true` markiert werden
2. E-Mail an User mit Hinweis auf neue Alumni-Preise + Re-Abschluss-Link
3. Am Periodenende: Stripe endet Abo → Webhook setzt `status=ended` → user zahlt bei Re-Abschluss Alumni-Preise

Trigger-Optionen: DB-Trigger on profiles.access_tier change, oder separater Cron-Job der täglich diffed.

### Failed-Payment-Dunning monitoren
Stripe retried automatisch (Smart Retries). Aber wir sollten eigenes Monitoring:
- Stripe-Dashboard regelmäßig auf `past_due`-Subscriptions checken
- Oder Slack-Benachrichtigung via `invoice.payment_failed` Webhook-Handler

## 🟢 Nice-to-have nach Launch

### Variante B — 1 Teaser-Aktion gratis
User ohne Abo darf 1× pro Lifetime eine Aktion ausführen (z.B. 1 Chat-Nachricht), dann greift Paywall.
Nötig: DB-Schema für Aktions-Counter pro User, Mechanismus gegen Abuse (Account-Neuanlage).

### Yearly-Plans in Stripe anlegen
Seed-Script hat nur Monthly-Prices. Für Jahresabos:
- Pro Plan 2 weitere Prices in Stripe (yearly basic + yearly community)
- Admin-UI: Price-IDs in `stripe_price_*_yearly`-Feldern eintragen

### Rabattcodes proaktiv nutzen
`allow_promotion_codes: true` ist schon im Checkout. Nur müssen Codes in Stripe angelegt werden
(Products → Coupons). Use-Cases: Launch-Promo, Influencer-Deals.

### Email-Benachrichtigungen
- Willkommen nach Abo-Start (via `customer.subscription.created`)
- Credits-niedrig-Warnung (wenn Credits < 10% des Monatskontingents)
- Kündigungs-Bestätigung (wenn `cancel_at_period_end=true` gesetzt)
- Rebill-Reminder (via `invoice.upcoming`, 7 Tage vor Rebill)

### Bundle-Käufe (Phase 3 vom initialen Plan)
Einmalkäufe: z.B. 99€ "Claude Starter Kit". Neue `bundles`-Tabelle, eigenes Checkout.

### Push-Notifications für Upsell
Aus dem originalen PDF-Konzept: Tag 3/7/14 nach Signup personalisierte Push-Nachrichten.
Braucht: PWA-Setup vollständig, Web-Push-Subscription + Server-Push-Service.

### Tests
Mindestens:
- Webhook-Handler (alle 6 Event-Types)
- chargeCredits / refundCredits Transaktionalität
- hasActionAccess / getMonetizationState

### Rate-Limiting
Auf Chat-Route + Toolbox-Routes. Gegen Abuse und API-Kosten-Blowups.

### Conversion-Analytics
Funnel-Tracking: Upsell-Sichtungen → Modal-Öffnungen → Checkout-Starts → Käufe.
Tools: Vercel Analytics, PostHog, eigenes Event-Tracking.

### Video-Creator Credit-Abbuchung
Video-Creator läuft als externer Worker via SSO. Credit-Verbrauch passiert dort, aber unser
Backend weiß davon nichts. Optionen:
- Worker ruft unser Backend bei jedem generierten Asset auf (Webhook)
- Oder: Worker nutzt unsere interne API (`/api/credits/charge`) mit signed Request

## Credit-Ablauf (Stand: rollieren unbegrenzt)
Aktuell: Gekaufte Credits haben `expires_at` = +100 Jahre. Effektiv kein Ablauf.
Falls später aus bilanziellen Gründen Ablauf nötig:
- Cron-Job täglich: `DELETE FROM credit_purchases WHERE credits_remaining = 0 OR expires_at < NOW()`
- Bei Verbrauch: `credit_purchases.credits_remaining` dekrementieren nach FIFO-Reihenfolge

Aktuell nicht implementiert — `chargeCredits()` dekrementiert nur `credit_wallets.purchased_balance` en bloc.
