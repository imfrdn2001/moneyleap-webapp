# MoneyLeap

MoneyLeap is a mobile-first Whack-a-Mole web experience built with a React/Vite frontend and an ASP.NET Core backend.

The current implementation is a **development/test flow**. Practice mode is single-player. Paid entry flows use a visibly labelled **Test Opponent** simulation while authentication, wallet, and payment integration are still pending. It must not be used for real-money play until the security and payment work in [Pending production work](#pending-production-work) is complete.

## Repositories

- Frontend: `moneyleap-webapp` (this repository)
- Backend: `../moneyleap-webapp-backend`

## Technology

- Frontend: React, TypeScript, Vite, CSS
- Backend: ASP.NET Core minimal API, .NET 10
- Local API proxy: Vite forwards `/api/*` to `https://localhost:7290`

## Current user flow

```mermaid
flowchart TD
    A[Homepage] --> B[Select Play Whack-a-Mole]
    B --> C{Choose match type}
    C -->|Practice: free, 15 moles| D[POST /api/matches\nisPractice: true]
    C -->|Choose denomination| E[Select ₹10 / ₹100 / ₹1,000 / ₹10,000]
    E --> F[Click Play for selected amount]
    F --> G[POST /api/matches\nisPractice: false, entryAmount]
    D --> H[3 → 2 → 1 → START]
    G --> H
    H --> I{Match type}
    I -->|Practice| J[Solo Whack-a-Mole board]
    I -->|Paid test flow| K[Test Opponent vs Player board]
    J --> L[Player clears configured mole count]
    K --> L
    L --> M[POST /api/matches/{matchId}/complete]
    M --> N{Practice?}
    N -->|Yes| O[Show only player time\nNice work: could have won a real match]
    N -->|No| P[Use configured outcome sequence\nfor this denomination]
    P --> Q{Player won?}
    Q -->|Yes| R[Show 2× entry payout\nConfetti and victory fanfare]
    Q -->|No| S[Show Test Opponent time\nEncouragement to play again]
    O --> T[Play again]
    R --> T
    S --> T
```

## Match rules currently configured

| Entry   | Moles | Displayed reward |
| ------- | ----: | ---------------: |
| ₹10     |    10 |              ₹20 |
| ₹100    |    15 |             ₹200 |
| ₹1,000  |    25 |           ₹2,000 |
| ₹10,000 |    35 |          ₹20,000 |

The backend owns these tiers in `moneyleap-webapp-backend/appsettings.json`. The frontend reads them from the API rather than hard-coding them.

### Test Opponent outcome sequences

`moneyleap-webapp-backend/Configuration/MatchOutcomeFlags.cs` contains a separate true/false sequence for each paid denomination. `true` means the player result is shown as a win; `false` means the Test Opponent result is shown as a win.

The sequence is independent for each entry amount and cycles after the final item. Practice games never use or consume these flags.

This is strictly a disclosed test simulation. It must not be presented as a real head-to-head opponent or used to determine real-money outcomes.

## Implemented API endpoints

The backend runs locally at `https://localhost:7290` (and `http://localhost:5139`). In frontend development, call these through `/api` so the Vite proxy handles the target URL.

### `GET /api/game-tiers`

Returns the configured Whack-a-Mole tiers.

```json
[
  { "entryAmount": 10, "moleCount": 10 },
  { "entryAmount": 100, "moleCount": 15 }
]
```

### Mock authentication endpoints

The development app silently creates an in-memory mock session. These endpoints are only for local development and must be replaced with real authentication before production:

- `POST /api/auth/mock-session`
- `GET /api/auth/me`
- `POST /api/auth/logout`

All match, referral, and wallet endpoints require the resulting bearer token.
The backend intentionally refuses to start outside the `Development` environment while mock services are configured.

### `POST /api/matches`

Creates a practice match or a paid test match.

Practice request:

```json
{ "isPractice": true, "entryAmount": null }
```

Paid test request:

```json
{ "isPractice": false, "entryAmount": 100 }
```

The server validates that paid amounts exist in the configured tiers. Practice requests with an entry amount are rejected. The response contains a server-generated `matchId`, mole count, entry amount, and match labels.

### `POST /api/matches/{matchId}/complete`

Completes an existing match and returns the player's elapsed time plus the test result. A match may only be completed once and expires after 10 minutes.

### Payment placeholder endpoints

These endpoints intentionally return `501 Not Implemented` until a real payment provider is integrated:

- `POST /api/wallet/top-ups`
- `POST /api/wallet/top-ups/{topUpId}/confirm`

Keeping placeholders makes the intended API boundary explicit without pretending payment is available.

### Mock referral and wallet endpoints

- `GET /api/referrals/me` — referral code, share path, reward history, and mock balance.
- `POST /api/referrals/claim` — claims a referral code for the current user before their first paid match.
- `GET /api/wallet` — mock wallet balance and transaction history.

When a referred user completes their first non-practice match, the referrer receives one mock ₹50 ledger entry. All mock data resets when the backend restarts.

## Current safeguards and limitations

The implementation currently includes:

- Server-owned game tiers and server validation of entry amounts.
- Server-generated GUID match identifiers.
- One-time match completion and expiry of abandoned in-memory matches.
- Practice games isolated from Test Opponent outcome sequences.
- No payment attempt from the frontend.
- Test Opponent clearly named in non-practice flows.

The following are intentional current limitations:

- Authentication is an in-memory **mock** session implementation only. It uses a device identifier and opaque token for local development, not a production identity system.
- Match data and sequence positions are held in memory and disappear when the backend restarts.
- The client currently reports completion after the UI mole count is cleared. This is not sufficient anti-cheat protection.
- There is no wallet balance, payment processor, transaction ledger, withdrawal, refund, or settlement system.
- There is no real multiplayer matchmaking or real opponent.

## Pending production work

Do not enable paid gameplay until these areas are implemented and independently reviewed.

### 1. Authentication and trusted user identity

Required changes:

1. Replace mock sessions with an identity solution, such as ASP.NET Core Identity with JWT, Auth0, Firebase Auth, or another OIDC provider.
2. Add sign-up, login, logout, token refresh, password recovery, and account verification flows as appropriate for the chosen provider.
3. Add an authenticated identity endpoint, for example `GET /api/auth/me`.
4. Protect match, wallet, payment, and referral endpoints with authorization.
5. Read the user ID from a validated server-side token claim—not from a request body, local storage value, or browser header supplied by the client.
6. Replace the temporary `Player` name with the authenticated user profile.

Suggested authenticated endpoint:

```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

```json
{
  "userId": "trusted-provider-subject-id",
  "displayName": "Chiranth",
  "walletBalance": 0
}
```

### 2. Wallet and payment integration

Required backend capabilities:

- `GET /api/wallet` — authenticated balance and ledger summary.
- `POST /api/wallet/top-ups` — create a provider payment order; never mark balance as credited here.
- `POST /api/payments/webhooks/{provider}` — verify the provider signature and credit the wallet only after a valid provider event.
- `POST /api/matches` — atomically reserve/debit the entry amount after checking wallet balance.
- `POST /api/matches/{matchId}/complete` — settle the match exactly once and credit valid winnings.
- `POST /api/withdrawals` — request a withdrawal subject to KYC, limits, fraud checks, and provider processing.
- `GET /api/wallet/transactions` — paginated immutable transaction ledger.

Important payment rules:

- Never trust “payment successful” information sent by the browser.
- Verify payment-provider webhooks with their signing secret.
- Use idempotency keys for payment, wallet, and settlement operations.
- Store all money movement in an append-only ledger and use database transactions.
- Store provider secrets in environment variables or a secret manager, never in source control.
- Consult legal, tax, gaming, KYC/AML, and payment-provider requirements before operating with real money.

### 3. Persistent data and reliability

Replace in-memory state with a production database, for example PostgreSQL or SQL Server.

Core records should include:

- `Users`
- `Wallets`
- `WalletTransactions`
- `PaymentOrders`
- `PaymentWebhookEvents`
- `Matches`
- `MatchEvents`
- `Settlements`
- `Referrals`

Use migrations, unique constraints, idempotency records, audit logging, backups, monitoring, and structured error reporting.

### 4. Game integrity and anti-cheat

For a real competitive game, the browser cannot be the authority for timing or results. The backend should:

- Authenticate the player before starting a match.
- Create and persist a server-owned match state.
- Issue a short-lived signed match token.
- Record or validate each mole appearance/hit using server time or a verifiable event stream.
- Apply rate limits and detect impossible input patterns.
- Validate completion only after the configured number of valid hits.
- Use deterministic, auditable settlement logic.
- Keep test simulations separate from any real competitive or paid game mode.

### 5. Real matchmaking and outcome fairness

When real multiplayer is added, replace Test Opponent logic with:

- A matchmaking queue based on game tier and availability.
- A real opponent match ID shared by both players.
- Server-authoritative timing and match state.
- A transparent, auditable winner calculation.
- Timeout, disconnect, cancellation, and refund rules.

## Local development

### Frontend

```bash
cd moneyleap-webapp
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

Production verification:

```bash
npm run build
```

### Backend

```bash
cd moneyleap-webapp-backend
dotnet restore
dotnet run --launch-profile https
```

The development API listens on `https://localhost:7290` and `http://localhost:5139`. A locally untrusted development HTTPS certificate is expected until it is trusted on the machine.

Production verification:

```bash
dotnet build
```

## Project structure

```text
moneyleap-webapp/
├── src/
│   ├── App.tsx              # Homepage and game-tier fetch
│   ├── GameModal.tsx        # Match selection, countdown, board, and results
│   ├── game-ui.tsx          # Shared game UI types and mole artwork
│   ├── index.css            # Responsive visual system and animations
│   └── main.tsx
├── vite.config.ts           # Development API proxy
└── README.md

moneyleap-webapp-backend/
├── Configuration/
│   └── MatchOutcomeFlags.cs # Test-only per-tier outcome sequences
├── Models/
│   ├── GameOptions.cs       # Tier configuration models
│   └── MatchContracts.cs    # API request/response contracts
├── Services/
│   ├── MatchService.cs      # In-memory test match lifecycle
│   └── OpponentTimingAlgorithm.cs
├── appsettings.json         # Whack-a-Mole tiers
└── Program.cs               # API endpoint registration
```
