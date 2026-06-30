# SportNest - UI/UX Navigation & Design Architecture Specification

**Document Reference:** SN-UIUX-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Design Paradigm:** Modern Glassmorphism & High-Contrast Dark Mode  
**Responsive Target:** Mobile-First Layout (Fluid breakpoints: 320px $\rightarrow$ 768px $\rightarrow$ 1280px $\rightarrow$ 1536px)  

---

## 1. Global Visual Standards & Design Tokens

SportNest utilizes a premium, content-first dark layout structure to align with elite sports branding.

### 1.1 Color Token Matrix

```
┌────────────────────────────────────────────────────────┐
│                      Color Tokens                      │
├───────────────┬───────────────┬────────────────────────┤
│ Token Name    │ Hex Value     │ Application Layer      │
├───────────────┼───────────────┼────────────────────────┤
│ Slate-950     │ #020617       │ Global Page Background │
├───────────────┼───────────────┼────────────────────────┤
│ Slate-900     │ #0f172a       │ Surface / Card Wrapper │
├───────────────┼───────────────┼────────────────────────┤
│ Blue-600      │ #2563eb       │ Brand Primary / CTA    │
├───────────────┼───────────────┼────────────────────────┤
│ Violet-600    │ #7c3aed       │ Brand Accent / Grads   │
├───────────────┼───────────────┼────────────────────────┤
│ Slate-50      │ #f8fafc       │ Primary Text Content   │
├───────────────┼───────────────┼────────────────────────┤
│ Slate-400     │ #94a3b8       │ Subheadings / Captions │
├───────────────┼───────────────┼────────────────────────┤
│ Emerald-500   │ #10b981       │ Status: Available/Success│
├───────────────┼───────────────┼────────────────────────┤
│ Amber-500     │ #f59e0b       │ Status: Reserved/Warning│
├───────────────┼───────────────┼────────────────────────┤
│ Rose-500      │ #f43f5e       │ Status: Damaged/Alert  │
└───────────────┴───────────────┴────────────────────────┘
```

### 1.2 Glassmorphism Surface Pattern
Cards and overlays must use the PostCSS-supported backdrop filter definition to build high-end UI depth:
```css
.glass-panel {
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

## 2. Navigation Architecture Map

```
                     ┌────────────────────────────────────────┐
                     │          SportNest Entrypoint          │
                     └────────────────────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌──────────────────────┐                     ┌──────────────────────┐
       │   Customer Portal    │                     │    Admin Console     │
       │   (localhost:3000)   │                     │   (localhost:3001)   │
       └──────────────────────┘                     └──────────────────────┘
                   │                                           │
         ┌─────────┼─────────┐                       ┌─────────┼─────────┐
         ▼         ▼         ▼                       ▼         ▼         ▼
     ┌───────┐ ┌───────┐ ┌───────┐               ┌───────┐ ┌───────┐ ┌───────┐
     │Catalog│ │Rentals│ │Events │               │Catalog│ │Returns│ │Matches│
     │Browse │ │Cart   │ │Browse │               │Config │ │Console│ │Score  │
     └───────┘ └───────┘ └───────┘               └───────┘ └───────┘ └───────┘
```

---

## 3. View Layout Specifications

### 3.1 Customer Portal Core Interface (`/`)
*   **Header Section:** Glassmorphic layout containing the animated SportNest logo, cart icon (displaying badge numbers), active registrations tab, and a profile slot showing the user's loyalty rating.
*   **Hero Grid:** Large promo slots with an offset search input to filter equipment by keyword/dates.
*   **Interactive Catalog Grid:** Cards displaying products with:
    *   Dynamic badge indicating "Store Purchase", "Daily Rental", or "Both".
    *   Price indicators.
    *   Availability indicators.

### 3.2 Unified Checkout Path (`/checkout`)
A unified multi-step interface handling retail purchases and rental bookings in a single transaction.

```
┌────────────────────────────────────────────────────────────────────────┐
│                               Checkout                                 │
├────────────────────────────────────────────────────────────────────────┤
│  [Step 1: Roster & Dates] ──▶ [Step 2: Deposit Details] ──▶ [Step 3]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Rental Reservation Schedule:                                          │
│  - English Willow Bat (Qty 1)                                          │
│    Duration: 2 Days (July 4, 2026 to July 5, 2026)                     │
│    Base Rate: $30.00                                                   │
│    Security Deposit (Fully Refundable): $100.00                        │
│                                                                        │
│  Retail Purchase:                                                      │
│  - Cricket Leather Balls (Qty 3)                                       │
│    Price: $45.00                                                       │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  Summary:                                                              │
│  - Items Total: $75.00                                                 │
│  - Deposit Hold: $100.00                                               │
│  - Total Charged Online: $175.00                                       │
│                                                                        │
│  [ Pay and Confirm In-Store Pickup ]                                   │
└────────────────────────────────────────────────────────────────────────┘
```

*   **Layout Sections:**
    1.  **Itemised Summary:** Separation between retail items and rental items (clearly detailing return schedules).
    2.  **Payment Area:** Fully PCI-compliant payment inputs using Stripe integration tokens.
    3.  **Deposit Ledger:** Clear breakdown explaining card authorization locks vs. captures.

### 3.3 Admin Match & Scoreboard Panel (`/admin/matches`)
*   **Left Pane:** Dynamic list of scheduled matches filtered by event ID and bracket round indices.
*   **Center Pane (Live Board):** Large high-contrast score editor allowing the tournament manager to edit points.
*   **Right Pane:** Real-time bracket compiler visualiser showing how the winner moves up the elimination tree.

---

## 4. UI States & Edge Cases

### 4.1 Empty States
Displayed when search queries yield zero items or when a cart is empty.
*   **Visual Standard:** Slate-900 border box with custom icon, helpful text, and a direct "Return to Browse" call-to-action button.

### 4.2 Booking Collision State (Overlaps)
If a unit becomes unavailable for selected dates while in checkout:
*   **Visual Standard:** High-contrast Amber banner overlay listing conflicting items. Displays a recommendation button to swap with identical inventory units (e.g. `BAT-0003` instead of `BAT-0002`).

### 4.3 Successful Transaction Modal
Displayed after successful payment confirmations.
*   **Visual Standard:** Dark full-page viewport displaying a large scannable QR Code voucher, order numbers, and coordinates for store pickup desk.

---

## 5. User Flows

### 5.1 Rental Booking & Pickup Lifecycle

```
[Customer: Browse Catalog] ──▶ [Select Product & Dates] ──▶ [Check Cart]
                                                                  │
                                                                  ▼
[QR Code Voucher Created] ◀── [Authorize & Capture Card] ◀── [Stripe Checkout]
            │
            ▼
[Customer Arrives at Store] ──▶ [Staff Scans QR Code] ──▶ [Inspect Unit & Release]
                                                                  │
                                                                  ▼
                                                      [Unit Status: Rented]
```

### 5.2 Tourney Entry & Match Progress Flow
```
[User: Browse Tournaments] ──▶ [Select Team Event] ──▶ [Create Roster & Pay Fee]
                                                                  │
                                                                  ▼
[Match Complete: Score Set] ◀── [Admin Score Board Entry] ◀── [Bracket Compiled]
            │
            ▼
[Advancement Rendered Live]
```
