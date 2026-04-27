# Skool ↔ Herr Tech World Sync

Status: **Plan / in Umsetzung** — Start 2026-04-24

## Ziel
KI Marketing Club (Skool) Teilnehmer automatisch in die Herr Tech World übertragen, admin-gesteuert einladen, und Plan S an Skool-Mitgliedschaft koppeln.

## Source of Truth: Stripe (LIVE-Account `acct_19r8YOAQth6p0gU9`)

Skool-Zugang wird über Stripe als **Einmal-Zahlung mit 12 Monaten Laufzeit** verkauft (kein Subscription-Produkt). Stripe kennt daher keinen automatischen Ablauf — den tracken wir selbst.

### Skool-Produkte (Stripe Product-IDs)
Es existieren mehrere Preisvarianten desselben Produkts „KI Marketing Club":
- `prod_U0auNKeujsyodG` — €2.990 (19. Feb)
- weitere Prices: €1.499 (4. Mär), €1.490 (26. Jan), €322,50/Monat (27. Jan)

→ Wir pflegen eine **Whitelist von Product-IDs** (`SKOOL_STRIPE_PRODUCT_IDS` in ENV), die als „verleiht Plan S" gelten. Neue Price-Varianten werden durch Hinzufügen der Product-ID aktiviert.

### Zugangs-Fenster pro Kauf
- **Start:** `payment_intent.created` bzw. `checkout.session.completed`
- **Ende:** Start + 12 Monate (außer monatliches Abo → folgt Stripe-Subscription-Status)
- **Re-Purchase:** Neuer Kauf verlängert `skool_access_expires_at` = `max(current, now) + 12 Monate`

## Datenmodell (Migration `032_skool_sync.sql`)

### Neue Tabelle `community_members`
```
id                         uuid PK
stripe_customer_id         text UNIQUE NOT NULL
email                      text NOT NULL
name                       text
skool_status               text ('active' | 'alumni' | 'cancelled')
skool_access_started_at    timestamptz
skool_access_expires_at    timestamptz        -- payment_date + 12 Monate
last_purchase_at           timestamptz
last_stripe_product_id     text
last_stripe_price_id       text
last_stripe_payment_intent text               -- Idempotenz
purchase_count             integer DEFAULT 1  -- Anzahl Käufe (Renewals)

invitation_token           text UNIQUE        -- Magic-Link-Token (30d)
invitation_token_expires   timestamptz
invited_at                 timestamptz
invitation_sent_count      integer DEFAULT 0
last_invited_at            timestamptz

profile_id                 uuid FK → profiles  -- null bis claimed
claimed_at                 timestamptz

created_at / updated_at
```

Index: `(skool_status, skool_access_expires_at)` für Ablauf-Cron, `(email)` für Lookup.

### Erweiterung `subscriptions`
Neue Spalte `plan_source text` mit Werten `'paid' | 'skool_community' | 'admin_granted'`.
- `skool_community` → Plan S gratis, gebunden an Skool-Mitgliedschaft
- `paid` → User zahlt selbst (hat eigenes Stripe-Abo)

Beim Skool-Alumni-Werden: Nur Subscriptions mit `plan_source='skool_community'` werden beendet.

### `stripe_events`
Wird weiter für Idempotenz genutzt — auch für Skool-Käufe.

## Flows

### 1. Neuer Skool-Kauf (Stripe-Webhook)
```
checkout.session.completed (Product ∈ SKOOL_STRIPE_PRODUCT_IDS)
  → upsert community_members by stripe_customer_id
  → skool_status = 'active'
  → skool_access_expires_at = max(current, now) + 12 Monate
  → last_purchase_at = now
  → purchase_count += 1 (bei Renewal)
```
**Keine automatische Einladung** — Admin entscheidet.

Wenn `profile_id` bereits gesetzt (User war schon claimed): Plan S wieder aktivieren / verlängern.

### 2. Admin-Einladung (`/admin/community`)
- Liste aller `community_members`, Filter: Status, claimed?, last_invited
- Button „Einladen" (einzeln) + „Alle uneingeladenen einladen" (Bulk)
- Erzeugt Token (32 bytes, 30 Tage gültig), speichert in `invitation_token`
- Versand via Resend mit eigenem Template (`renderSkoolInviteEmail`)
- Re-Invite: gleicher Button → neuer Token, `invitation_sent_count++`

### 3. Claim-Flow (`/invite/skool/[token]`)
- Token validieren (nicht abgelaufen, nicht claimed)
- Falls `profile_id` gesetzt → redirect zu Login (Magic-Link an gleiche E-Mail)
- Signup-Formular (Passwort oder Magic-Link)
- Bei erfolgreichem Signup:
  - `community_members.profile_id` + `claimed_at` setzen
  - `profiles.access_tier = 'premium'`
  - `subscriptions` insert: `plan_id='plan_s'`, `price_band='community'`, `plan_source='skool_community'`, `current_period_end=skool_access_expires_at`
  - Credit-Wallet anlegen

### 4. Ablauf-Cron (`/api/cron/skool-expiry`, täglich)
Läuft 1× pro Tag, findet `community_members` mit `skool_access_expires_at < now` und `skool_status='active'`:
- `skool_status = 'alumni'`
- Wenn `profile_id` vorhanden:
  - `profiles.access_tier = 'alumni'` (nur wenn aktuell `premium` **und** keine `paid` Subscription aktiv)
  - Zugehörige `subscriptions` mit `plan_source='skool_community'` → `status='ended'`, `ended_at=now`
- **Paid-Subs bleiben unangetastet** (User zahlt selbst)

### 5. Upgrade-Szenario (User kauft eigenes Abo)
- User hat Plan S über Skool (`plan_source='skool_community'`)
- Kauft selbst Plan M → neue Subscription mit `plan_source='paid'`
- Beim Webhook: alte `skool_community` Subscription → `status='ended'` (Plan M überschreibt)
- Bei späterem Alumni-Werden: Nichts passiert, weil keine `skool_community`-Sub mehr aktiv

### 6. Premium-vor-Skool-Szenario
User hat bereits zahlendes Abo und tritt Skool bei: Kein Konflikt, `plan_source` bleibt `'paid'`. `community_members` wird trotzdem angelegt, aber Plan S wird nicht aktiviert (hat schon was Größeres/Gleichwertiges).

## Config (ENV)
```
SKOOL_STRIPE_PRODUCT_IDS=prod_U0auNKeujsyodG,prod_xyz,...
SKOOL_ACCESS_DAYS=365
CRON_SECRET=... (bereits vorhanden für Wistia-Sync)
```

## Initial-Import (Script `scripts/import-skool-members.ts`)
Einmaliger Backfill aus Stripe:
1. Für jede Product-ID in `SKOOL_STRIPE_PRODUCT_IDS`:
2. List all Charges + Checkout Sessions in der Zeit
3. Gruppiere nach `customer_id`, nimm jüngste Zahlung
4. Upsert in `community_members`, `skool_access_expires_at = last_payment + 12 Monate`
5. Log für manuelle Review

## Admin-UI `/admin/community`
Nach `/admin/users` modelliert:
- Tabelle: Name, E-Mail, Status (Badge), Zugang bis, Eingeladen (x Mal, zuletzt), Claimed?
- Filter: Status (active/alumni/cancelled), Claimed (ja/nein), Eingeladen (ja/nein)
- Actions: Einladen, Re-Invite, Details, Manuell als Alumni markieren
- Bulk: „Alle noch-nicht-eingeladenen aktiven einladen" (Rate-Limit: 100/Stunde via Resend)

## Testing-Strategie (Live-Stripe, keine Test-Umgebung)
- Kein Live-Testen mit echtem Geld
- Phase 1: DB-Migration + UI auf Staging deployen, **Webhook-Handler deaktiviert** (Feature-Flag `SKOOL_SYNC_ENABLED=false`)
- Phase 2: Initial-Import im DRY-RUN-Mode laufen lassen, Output reviewen
- Phase 3: Jacobs Freigabe → Import scharf schalten, Webhook-Handler aktivieren
- Phase 4: Monitoring: Admin-Widget „Letzte 10 Skool-Events" im Dashboard

## Schritte (Implementation Order)
1. ✅ Plan festgehalten
2. ☐ Migration `032_skool_sync.sql`
3. ☐ Stripe-Webhook erweitern: `checkout.session.completed` für Skool-Produkte
4. ☐ Daily Cron `/api/cron/skool-expiry`
5. ☐ Email-Template `renderSkoolInviteEmail` + `sendSkoolInviteEmail()`
6. ☐ Admin-UI `/admin/community`
7. ☐ Claim-Route `/invite/skool/[token]/page.tsx`
8. ☐ Initial-Import-Script
9. ☐ Feature-Flag + Staging-Deploy
10. ☐ Live-Schaltung nach Review
