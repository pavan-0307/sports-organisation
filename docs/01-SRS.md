# SportNest - Software Requirements Specification (SRS)

**Document Reference:** SN-SRS-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Target Platform Version:** 1.0 (Commercial Production Release)  

---

## 1. Introduction

### 1.1 Document Purpose
This Software Requirements Specification (SRS) defines the complete functional, non-functional, business, and architectural requirements for Version 1.0 of the **SportNest** Sports Management Platform. It serves as the single source of truth for engineering teams, QA teams, product owners, and business stakeholders.

### 1.2 System Overview
SportNest is an enterprise-grade, all-in-one Sports Management Platform designed as a commercial Software-as-a-Service (SaaS) application. Version 1.0 operates as a direct-to-consumer (D2C) model where SportNest owns all inventories, products, and services. The system consolidates sports equipment rental, retail e-commerce, and event management into a unified digital experience.

### 1.3 Intended Audience
This document is structured for:
*   **System Architects & Software Engineers:** To design database schemas, micro-frontends, API endpoints, and message queues.
*   **Quality Assurance Engineers:** To build integration tests, end-to-end regression suites, and verification checklists.
*   **Product Managers & Business Stakeholders:** To verify feature alignment with commercial objectives and success criteria.

---

## 2. Product Vision

The vision of SportNest is to become the premier operational backbone for sports organisations, clubs, athletes, and local communities. By centralising equipment acquisition (purchase or rental) and tournament coordination into a single, high-fidelity digital platform, SportNest removes the fragmentation associated with modern sports administration. In the long term, SportNest will scale from a centralised inventory model to an open multi-vendor marketplace, academy network, and venue booking marketplace.

---

## 3. Mission

To democratise access to sports by providing organisations and individuals with top-tier physical gear, seamless rental logistics, and robust tournament hosting tools, backed by high-performance SaaS infrastructure.

---

## 4. Business Objectives

The commercial viability of SportNest Version 1.0 is tied to the following strategic objectives:
*   **Inventory Utilisation Rate:** Achieve a minimum of 75% utilisation rate for high-value rental equipment (e.g., premium bats, bowling machines, protective kits) within the first 6 months of operation.
*   **Order Fulfilment Turnaround:** Maintain a store pickup ready-time of under 2 hours from checkout confirmation.
*   **Payment Success & Checkout Conversion:** Target a payment conversion rate of $\ge 98\%$ through integrated, redundant payment gateways (PGR).
*   **Event Sign-Up Growth:** Scale regional tournament registrations to $\ge 500$ concurrent participant entries per weekend event during peak seasons.

---

## 5. Scope

### 5.1 In-Scope (Version 1.0)
The initial release encompasses three core pillars:
1.  **Equipment Rental:** Search catalog, select dates, pre-pay online, and pick up verified items from the physical warehouse/store. Includes tracking individual item lifecycles (serialised inventory tracking).
2.  **Sports Store (E-Commerce):** Complete retail path for brand-new equipment purchases, online payments, and in-store pick up.
3.  **Event Management:** Event listing, structure setup (individual/team registration), bracket generation, entry fee payments, and schedule publication.

### 5.2 Out-of-Scope (Future Releases)
*   Ground Booking / Venue Reservation.
*   Sports Academies Portal.
*   Coaching & Training Marketplace.
*   Recurring Membership Subscription Plans.
*   Native Mobile Apps (iOS and Android).
*   Third-Party Vendor Onboarding (Multi-Vendor Marketplace).

---

## 6. Functional Requirements

### 6.1 Functional Requirements Matrix

| ID | Module | Feature Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | Authentication | Passwordless Multi-Factor Authentication (OTP via Email/SMS). | High |
| **FR-AUTH-02** | Authentication | Role-Based Access Control (RBAC) token assignment upon login. | High |
| **FR-USER-01** | User Management | Customer profile management with rental deposit metrics. | Medium |
| **FR-USER-02** | User Management | Staff log tracking for inventory inspections. | Medium |
| **FR-CAT-01**  | Categories | Nested categories for sports (e.g., Cricket -> Batting -> Pads). | High |
| **FR-PROD-01** | Products | Serial number generation and SKU binding. | High |
| **FR-INV-01**  | Inventory | Unique Unit tracking (e.g., BAT-0001) with dedicated condition state logs. | High |
| **FR-INV-02**  | Inventory | Lifecycle status transitions (Available $\rightarrow$ Reserved $\rightarrow$ Rented $\rightarrow$ Maintenance $\rightarrow$ Damaged). | High |
| **FR-RENT-01** | Equipment Rental| Date-range collision check blocking double booking of item serials. | High |
| **FR-RENT-02** | Equipment Rental| Automatic calculations of security deposits and late-return fines. | High |
| **FR-STOR-01** | Sports Store | Multi-item cart checkout for physical retail items. | High |
| **FR-STOR-02** | Sports Store | Inventory stock count decrement on successful payment. | High |
| **FR-ORD-01**  | Orders | Order state machine transitions (Created $\rightarrow$ Paid $\rightarrow$ ReadyForPickup $\rightarrow$ Completed $\rightarrow$ Refunded). | High |
| **FR-ORD-02**  | Orders | Generation of scannable QR Codes for pickup authentication at the counter. | Medium |
| **FR-PAY-01**  | Payments | Integration with online payment processor (Stripe/Razorpay). | High |
| **FR-PAY-02**  | Payments | Automatic refund engine for cancellations or deposit releases. | High |
| **FR-EVNT-01** | Events | Single & Double Elimination tournament bracket auto-generator. | Medium |
| **FR-EVNT-02** | Events | Team registration management with roster size validations. | High |
| **FR-NOTI-01** | Notifications | Transactional SMS/Email updates for pickup windows and rental deadlines. | High |
| **FR-REP-01**  | Reports | Exporter tool for financial audits, rental loss ratios, and stock counts. | Medium |
| **FR-CMS-01**  | CMS | Control panel to manage landing page hero graphics and promotions. | Low |
| **FR-SET-01**  | Settings | Global parameters config (Late return multiplier, base deposit rates). | High |

---

## 7. Non-Functional Requirements

### 7.1 Security & Compliance
*   **Data Protection:** Enforce TLS 1.3 for all transit paths. Database fields containing Personally Identifiable Information (PII) must be encrypted at rest using AES-256.
*   **Compliance:** Maintain strict PCI-DSS Level 4 compliance. No raw credit card credentials shall ever touch SportNest servers; payment operations must use tokenised client payloads.

### 7.2 Scalability & Availability
*   **Uptime SLA:** $\ge 99.95\%$ operational availability per calendar month, excluding scheduled maintenance windows.
*   **Concurrent Users:** System architecture must support up to 5,000 concurrent web socket connections for real-time score updates and inventory checking.

### 7.3 Performance
*   **API Response Time:** P95 response latency for REST endpoints must stay under 200ms.
*   **Catalog Page Load:** Core Web Vitals (Largest Contentful Paint) under 1.5 seconds under 3G throttling networks.

### 7.4 Reliability
*   **Data Consistency:** Transaction boundaries must encompass double-booked rental validation and store checkout. Database engine must strictly enforce ACID guarantees.

---

## 8. User Roles

The platform defines five distinct personas:
1.  **Guest:** Unauthenticated user searching catalog, checking tournament listings, and viewing basic store inventories.
2.  **Customer:** Authenticated user who pays for store orders, registers for sports tournaments, rents gear, and tracks returns.
3.  **Staff:** Front-office operator at the physical pickup store who inspects physical rentals, accepts returns, hands over orders via QR scanner, and changes item states (e.g., to Maintenance).
4.  **Admin:** Regional manager overseeing catalog configurations, pricing matrices, category setup, payment resolutions, and event planning.
5.  **Super Admin:** System owner possessing root permissions to edit global system keys, manage developer keys, alter database records directly, and assign admin roles.

---

## 9. User Permissions

### 9.1 RBAC Permission Matrix

| Module/Resource | Guest | Customer | Staff | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Catalog** | Read | Read | Read | Read | Read |
| **Rent Equipment** | None | Create/Read | Read | Read | Read |
| **Initiate Payments** | None | Create | None | None | None |
| **Manage Catalog** | None | None | Read | CRUD | CRUD |
| **Update Inventory State** | None | None | Update | CRUD | CRUD |
| **Inspect / Handover Order** | None | None | Read/Update | CRUD | CRUD |
| **Create Tournament** | None | None | None | CRUD | CRUD |
| **Configure Settings** | None | None | None | None | CRUD |
| **Manage Users & Staff** | None | None | None | CRUD | CRUD |

---

## 10. Business Rules

### 10.1 Inventory Integrity & States
Every item in the inventory registry is mapped to one and only one status at any given timestamp. The state engine must follow the lifecycle defined below:

```
                  ┌───────────────┐
                  │   Available   │◀──────────────────────────────┐
                  └───────────────┘                               │
                          │                                       │
                          ▼ (Customer Checkout)                   │ (Inspection Clear)
                  ┌───────────────┐                               │
                  │   Reserved    │                               │
                  └───────────────┘                               │
                          │                                       │
                          ▼ (Staff Handover)                      │
                  ┌───────────────┐                               │
                  │    Rented     │                               │
                  └───────────────┘                               │
                          │                                       │
                          ▼ (Customer Return / Store Receipt)     │
                  ┌───────────────┐                               │
                  │  Maintenance  │───────────────────────────────┤
                  └───────────────┘                               │
                          │                                       │
                          ▼ (Inspection Failed)                   │
                  ┌───────────────┐                               │
                  │    Damaged    │───────────────────────────────┘ (After Repair)
                  └───────────────┘
```

*   **Status Definitions:**
    *   **Available:** The item resides in the local store and can be rented immediately.
    *   **Reserved:** Customer completed payment; item is locked for store pickup window (48 hours).
    *   **Rented:** Item has been picked up by the customer and is currently outside the store.
    *   **Maintenance:** Returned items are automatically flagged for inspection and cleaning before re-entering pool.
    *   **Damaged:** Flags items needing replacement, repairs, or write-off logs.

### 10.2 Payment & Fulfillment Rules
*   **Online Only:** Cash on Delivery (COD) is disabled. Cart checkouts require verified online payment gateway captures.
*   **Store Pickup Only:** Shipping and logistical delivery options are out of scope for V1. Customers must pick up their retail or rental orders from the primary physical outlet.
*   **Security Deposits:** Rental checkouts hold a mandatory security deposit block on credit cards. Upon return inspection, the deposit is either fully released, partially captured for repair, or fully captured for loss.
*   **Overdue Returns:** Late fees accrue hourly based on global multiplier parameters configured in the System Settings module.

---

## 11. Module Description

### 11.1 Authentication & Security Module
Handles token issuance via secure JWTs. Utilises double-wrapped API keys for internal microservice authentication. Enforces device session limits and coordinates passwordless logins.

### 11.2 Inventory & Category Module
Coordinates hierarchical category routing. Tracks the physical items via a 1:N mapping (Product to Inventory Unit). Every physical unit must possess a barcode/QR lookup value.

### 11.3 Equipment Rental Engine
Contains the reservation scheduler. Runs high-speed transaction locks on calendar periods. Prevents overbooking of specific item serials.

### 11.4 Sports Store & Order Tracker
Translates user carts into distinct order records. Exposes updates via transactional event buses when products transition through packing, loading, and ready-for-pickup stages.

### 11.5 Tournament & Event Host
Supports single/team registrations. Bracket compiler builds tournament trees dynamically. Admin interface allows tournament managers to record live match scores.

---

## 12. User Stories

### 12.1 US-RENT-001: Item Booking
**As a** Customer,  
**I want to** reserve a premium cricket kit for a specific weekend range,  
**So that** I don't have to purchase expensive equipment for a one-off match.  

*   **Acceptance Criteria:**
    *   **Given** I am on the equipment rental listing screen,
    *   **When** I pick dates from Saturday 08:00 to Sunday 18:00,
    *   **Then** the system must only display individual items that are in 'Available' state for that entire duration.
    *   **Given** I have added the item to my rental cart,
    *   **When** I progress to checkout and complete the online gateway payment,
    *   **Then** the selected unit status must transition to 'Reserved', and the system must output a pickup voucher containing a QR code.

### 12.2 US-INV-002: Return Inspection Flow
**As a** Store Staff Member,  
**I want to** log the return of a rented golf club set,  
**So that** it goes to maintenance and has its condition state evaluated before the next reservation.  

*   **Acceptance Criteria:**
    *   **Given** I am on the staff console return dashboard,
    *   **When** I scan the customer's return barcode or type the item code,
    *   **Then** the system must change the item status from 'Rented' to 'Maintenance'.
    *   **When** I complete the physical check form indicating no cosmetic or functional damage,
    *   **Then** the unit status changes to 'Available', and the database releases the customer's held deposit block.

### 12.3 US-EVNT-003: Double Elimination Bracket Generator
**As a** Tournament Manager (Admin),  
**I want to** auto-compile a Double Elimination bracket for a 16-player Chess event,  
**So that** I do not have to draw match trees manually.  

*   **Acceptance Criteria:**
    *   **Given** 16 registrants have paid and checked in to my event,
    *   **When** I click "Compile Brackets",
    *   **Then** the system creates a winner's bracket and a loser's bracket.
    *   **When** a player loses a match in the winner's bracket,
    *   **Then** they must be automatically pushed down to the corresponding round in the loser's bracket.

---

## 13. Use Cases

### 13.1 Use Case 1: Equipment Rental and Pickup Flow

```
+------------+              +-----------------------+              +-------------+
|  Customer  |              |   SportNest Portal    |              | Store Staff |
+------------+              +-----------------------+              +-------------+
      │                                 │                                 │
      │─── 1. Select Rental & Date ────▶│                                 │
      │                                 │─── 2. Reserve Serial ──────────▶│
      │                                 │    (State Change: Reserved)     │
      │                                 │                                 │
      │─── 3. Complete Online Payment ─▶│                                 │
      │                                 │─── 4. Generate QR Voucher ─────▶│
      │                                                                   │
      │─── 5. Visit Store & Present QR ──────────────────────────────────▶│
      │                                                                   │─── 6. Scan QR & Check ID
      │                                                                   │    (State Change: Rented)
      │◀──────────────────────── 7. Handover Gear ────────────────────────│
```

#### Detailed Use Case Flow:
1.  **Actor:** Customer, System, Staff.
2.  **Pre-conditions:** The Customer is logged in and possesses a valid payment instrument. The item is in 'Available' state.
3.  **Basic Path:**
    1.  Customer browses the rental inventory, filters by date range, and adds item `BAT-0002` to cart.
    2.  System validates that no other booking overlaps with this timeframe.
    3.  Customer enters credit card details and executes checkout.
    4.  System confirms transaction, locks `BAT-0002` as `Reserved`, and generates a secure checkout QR code.
    5.  Customer arrives at the physical store pickup desk and shows the QR code to the Staff.
    6.  Staff scans the QR code via tablet console, checks physical identity, retrieves `BAT-0002` from storage, and releases it.
    7.  System updates unit `BAT-0002` status to `Rented`.
4.  **Alternative Path (Card Declined):**
    1.  Payment gateway returns an error.
    2.  System alerts user and releases temporal reservation lock on `BAT-0002` after 10 minutes of inactivity.

---

## 14. Assumptions
*   **Continuous Connectivity:** Store pickup terminals remain connected to the internet. If connection drops, checkout processing is halted.
*   **Third-Party Notifications:** SMS/Email delivery speeds are dependent on external messaging vendors.
*   **Staff Training:** Store operators are trained to inspect rental gear objectively according to standardised damage evaluation rubrics.

---

## 15. Constraints
*   **No Vendor Module:** All catalogue products are stored and owned directly by SportNest. Multi-tenant logistics are explicitly disabled.
*   **No Physical Shipments:** System handles store pick up only. No address verification API or carrier logic is present.
*   **Platform Runtime:** Backend requires Node.js v20+ runtime environment running over PostgreSQL database.

---

## 16. Future Scope

```
┌────────────────────────────────────────────────────────┐
│               SportNest Platform Roadmap               │
├───────────────────────┬────────────────────────────────┤
│ Phase                 │ Key Modules & Capabilities     │
├───────────────────────┼────────────────────────────────┤
│ Version 1.0 (Current) │ Rental, Retail Store, Events   │
├───────────────────────┼────────────────────────────────┤
│ Version 1.5           │ Venue Booking, Academies Portal│
├───────────────────────┼────────────────────────────────┤
│ Version 2.0           │ Multi-Vendor, Coaching Market  │
└───────────────────────┴────────────────────────────────┘
```

*   **Venue Booking:** Allow local facilities to register courts and pitches for rent.
*   **Academies & Instructors:** Allow parents to register children for sports coaching cohorts.
*   **Subscription Models:** Monthly membership passes giving customers zero-deposit rentals and discounts on events.

---

## 17. Glossary

*   **Asset / Inventory Unit:** A specific physical item identified by a unique barcode or serial reference (e.g., `BALL-004`).
*   **Bracket Compiler:** Algorithms mapping event registrants into elimination trees.
*   **D2C:** Direct-to-Consumer business architecture.
*   **Late Return Multiplier:** A variable defining compounding financial penalties for overdue items.
*   **OTP:** One-Time Password used during passwordless multi-factor authentication.
*   **PCI-DSS:** Payment Card Industry Data Security Standard.
*   **SKU:** Stock Keeping Unit used to identify retail products.

---

## 18. Success Criteria

For the platform to be cleared for production deployment, it must meet the following metrics during QA and staging runs:

*   **Zero Fatal Linter Errors:** Clean linter verification across the codebase.
*   **Unit & Integration Coverage:** At least 80% test code coverage on core mathematical paths (Rental rates, deposits, late fine calculations).
*   **Concurrency Stress Test:** Zero deadlock errors during simulations of 200 concurrent checkout bookings on the exact same catalogue product category.
*   **Prerender Compliance:** Next.js build runs cleanly without any unresolved server-side routes or manifest reference missing errors.
