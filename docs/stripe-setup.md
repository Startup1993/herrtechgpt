# Stripe Setup — Herr Tech World

Payment-Provider für Abos (S/M/L) und Credit-Top-ups. Ablöst die ursprünglich
geplante Ablefy-Integration wegen besserer API, niedrigerer Gebühren und
moderner Checkout-UX.

## 1. Accounts anlegen

1. **[stripe.com](https://stripe.com)** → Account erstellen (Firma: Herr Tech / Florian Hübner GmbH)
2. **Business-Details hinterlegen** (USt-ID, Kontodaten) — ohne das kein Live-Payout
3. **Stripe Tax aktivieren** → Settings → Tax → Enable. Das regelt USt automatisch
   für EU-Käufer (OSS, Reverse Charge B2B). Kostet 0,5 % extra, spart aber
   Lexoffice-Handarbeit.

## 2. Env-Variablen

Folgende Variablen in `.env.local` (lokal) und im Vercel-Dashboard (Staging +
Live) eintragen. Test-Keys auf Staging, Live-Keys nur auf Production.

```bash
# Server-seitig (niemals ins Client-Bundle)
STRIPE_SECRET_KEY=sk_test_xxx            # Dashboard → Developers → API Keys
STRIPE_WEBHOOK_SECRET=whsec_xxx          # Nach Webhook-Anlage (siehe Schritt 4)

# Client-seitig (darf ins Browser-Bundle)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Wichtig:** Test-Mode und Live-Mode haben **komplett getrennte** Keys, Produkte,
Prices und Webhooks. Nie mischen.

## 3. Produkte + Preise anlegen

Pro Plan (S/M/L) **1 Product** mit **4 Prices** in Stripe Dashboard anlegen
(Products → Add Product). Für Phase 1 reichen monatliche Preise — jährliche
können später.

### Plan S — „Starter"
- **Product:** `Herr Tech World S`
- **Prices (recurring, monthly):**
  - `19,00 €` → Metadata: `band=basic`, `tier=S`, `cycle=monthly`
  - `0,00 €` → Metadata: `band=community`, `tier=S`, `cycle=monthly`
    *(Stripe erlaubt 0€-Prices — erzeugt eine Subscription ohne Charge.
    Perfekt für „Community-Mitglied = S gratis".)*

### Plan M — „Professional"
- **Product:** `Herr Tech World M`
- **Prices (monthly):**
  - `49,00 €` → `band=basic`
  - `29,00 €` → `band=community`

### Plan L — „Power"
- **Product:** `Herr Tech World L`
- **Prices (monthly):**
  - `99,00 €` → `band=basic`
  - `69,00 €` → `band=community`

### Credit-Top-ups (one-time, nicht recurring!)
Pro Pack 1 Product mit 2 Prices (Basic/Community):
- `+100 Credits` → 9€ / 6€
- `+500 Credits` → 35€ / 25€
- `+2000 Credits` → 99€ / 69€

Nach Anlage: **Price-IDs (price_xxx) im Admin-UI eintragen** unter
`/admin/monetization/plans` bzw. `/admin/monetization/credits`.

## 4. Webhook-Endpoint einrichten

Dashboard → Developers → Webhooks → **Add endpoint**.

- **URL:**
  - Lokal (mit Stripe CLI Forwarding): `http://localhost:3000/api/webhooks/stripe`
  - Staging: `https://staging.herr.tech/api/webhooks/stripe`
  - Production: `https://world.herr.tech/api/webhooks/stripe`
- **Events to send** (mindestens):
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `payment_intent.succeeded` (für Credit-Top-ups)

Nach Anlage das **Signing Secret** (`whsec_xxx`) in `STRIPE_WEBHOOK_SECRET`
eintragen.

### Lokales Testen mit Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Liefert whsec_xxx für lokale .env.local
```

## 5. Customer Portal aktivieren

Dashboard → Settings → **Billing → Customer portal** → *Activate*.

Konfigurieren:
- ✅ Invoices einsehen
- ✅ Payment Method aktualisieren
- ❌ **Subscription cancellation** — deaktivieren (wir bauen eigenen Kündigen-Button)
- ❌ Pause subscription — deaktivieren
- ❌ Update subscription quantity / plan — deaktivieren (wir steuern das)

Damit ist der Portal-Link nur für „Rechnungen ansehen + Zahlungsmethode ändern".

## 6. Test-Kartennummern

Für End-to-End-Tests im Test-Mode:
- **Erfolgreich:** `4242 4242 4242 4242` (jedes Datum, jeder CVC)
- **3D-Secure-Challenge:** `4000 0025 0000 3155`
- **Zahlung fehlschlagen:** `4000 0000 0000 0002`
- [Alle Test-Cards](https://stripe.com/docs/testing)

## 7. Produktivstellung (später)

Wenn das Ganze auf Staging abgenommen ist:
1. In Stripe: **Live-Mode aktivieren** (Dashboard oben rechts)
2. Live-Produkte + Prices **identisch** anlegen (Stripe kopiert Test → Live nicht)
3. Live-Webhook-Endpoint (`world.herr.tech/...`) mit allen Events
4. Live-Keys in Vercel-Production-ENV
5. Admin-UI: Price-IDs auf Live-IDs umstellen

## Architektur-Referenzen (Code)

- `src/lib/stripe.ts` — Server-Singleton + `verifyWebhook()`
- `src/app/api/webhooks/stripe/route.ts` — *(kommt in Phase 2)*
- `src/app/api/checkout/subscription/route.ts` — *(kommt in Phase 2)*
- `supabase/migrations/028_monetization.sql` — DB-Schema (`stripe_customer_id`,
  `stripe_subscription_id`, `stripe_price_*`-IDs in `plans` + `credit_packs`,
  `stripe_events` Idempotenz-Log)
