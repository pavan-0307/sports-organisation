# SportNest - Security Architecture Specification

**Document Reference:** SN-SEC-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Regulatory Context:** GDPR, PCI-DSS Level 4 Compliant  

---

## 1. Authentication & Session Strategy

SportNest uses a stateless, token-based authentication mechanism combined with stateful token invalidation for maximum security and scalability.

```
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  Client App  │              │  API Gateway │              │ Auth Service │
└──────────────┘              └──────────────┘              └──────────────┘
       │                              │                              │
       │─── 1. POST /login ──────────▶│                              │
       │                               ─── 2. Validate Credentials ─▶│
       │                                                             │─── 3. Generate Access + Refresh
       │◀── 4. Set Refresh (HttpOnly) ◀──────────────────────────────│
       │    Return Access (JSON)      │                              │
       │                              │                              │
       │─── 5. Request with Access ──▶│                              │
       │    (Bearer in Header)        │─── 6. Verify Signature ─────▶│ (Local Cache)
```

### 1.1 JSON Web Tokens (JWT) Design
*   **Signature Algorithm:** HMAC SHA-256 (`HS256`) or RSA Signature with SHA-256 (`RS256`).
*   **Token Expiry (Access Token):** 15 minutes.
*   **Payload Claims:**
    ```json
    {
      "iss": "sportnest-auth-service",
      "sub": "019067b5-24e5-79a4-a3cd-b956241a293b",
      "role": "customer",
      "exp": 1782814910,
      "iat": 1782814010,
      "jti": "9b1deb4d-3b7d-4bad-9bdd-2b1c4b721867"
    }
    ```

### 1.2 Refresh Token Strategy
*   **Storage Mechanism:** Saved on the client side using a secure `HttpOnly`, `Secure`, `SameSite=Strict` cookie to eliminate Cross-Site Scripting (XSS) extraction risks. Path restricted specifically to `/v1/auth/refresh`.
*   **Database Sync:** Persisted in Redis or PostgreSQL (`user_refresh_tokens` table) with a unique token ID matching the access token's `jti` to support immediate session revocation (e.g., when a user locks their account or changes passwords).
*   **Token Expiry:** 7 days. Automatic rotation (refresh token rotation) applied: every time a refresh token is used, a new access/refresh token pair is returned, and the old refresh token is immediately invalidated. If a used refresh token is presented again, it triggers a security alert and invalidates all active sessions for that user (replay attack protection).

### 1.3 Session Management
*   **Max Concurrent Sessions:** Restricted to 5 devices per account.
*   **Revocation Paths:** Exposes a `/auth/logout` endpoint that removes the cookie, clears the token record from the cache, and blacklists the corresponding access token `jti` in Redis for its remaining time-to-live (TTL).

---

## 2. Password Hashing & Encryption Standards

*   **Algorithm:** **Argon2id** (specifically Profile `Argon2id` which is resistant to both side-channel and GPU-based cracking attacks).
*   **Config Parameters (OWASP Recommended):**
    *   Memory: 64 MB (65536 KB)
    *   Iterations (Time cost): 3 passes
    *   Parallelism: 4 threads
    *   Key Length: 32 bytes
    *   Salt Size: 16 bytes random cryptographically secure salt (using CSRNG)
*   **Encryption at Rest:** Sensitive fields in database tables (like user phone numbers or address logs) are encrypted using AES-256-GCM. Decryption keys are stored inside external key vaults.

---

## 3. Access Control (RBAC)

SportNest implements strict Role-Based Access Control (RBAC).

```
[Request] ──▶ [JWT Auth Middleware] ──▶ [RBAC Guard Middleware] ──▶ [Target Resource]
                     │                          │
                     ▼ (Verification)           ▼ (Access Verification)
              Valid Token?                User Role has Perms?
```

*   **Hierarchy Enforcement:** Roles follow a strict linear privilege hierarchy:  
    `Guest` $\rightarrow$ `Customer` $\rightarrow$ `Staff` $\rightarrow$ `Admin` $\rightarrow$ `Super Admin`.
*   **Implementation Rule:** The authorization gateway uses code middleware decorators on Express routers:
    ```typescript
    // Logical Representation:
    router.put('/products/:id', authorizeRoles('admin', 'super_admin'), updateProductHandler);
    ```
*   **Access Denial Protocol:** Fails immediately with `HTTP 403 Forbidden` and logs the failed attempt to the intrusion detection log.

---

## 4. API & Network Security

### 4.1 CORS (Cross-Origin Resource Sharing)
*   **Allowed Origins:** Explicit whitelist only. Wildcards (`*`) are prohibited in production.
    *   `https://sportnest.com` (Main Site)
    *   `https://admin.sportnest.com` (Console)
*   **Allowed Methods:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
*   **Headers allowed:** `Authorization`, `Content-Type`, `X-Client-Version`.
*   **Credentials:** `Access-Control-Allow-Credentials: true` is strictly required to pass secure cookies across origins.

### 4.2 Helmet Configuration
Protects HTTP headers from common vulnerabilities. Next/Express servers must include:
*   `X-Frame-Options: DENY` (prevents Clickjacking).
*   `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing).
*   `Content-Security-Policy (CSP):` Enforces script-source whitelists and blocks inline eval.
*   `Strict-Transport-Security (HSTS):` `max-age=63072000; includeSubDomains; preload` (enforces HTTPS permanently).

### 4.3 Rate Limiting
Rate limiting is enforced at the API Gateway proxy layer:
*   **Global Limit:** 100 requests per minute per IP address. Exceeding triggers `HTTP 429 Too Many Requests`.
*   **Authentication Routes (`/auth/login/*`):** Max 5 requests per 15 minutes per IP/User email combination.
*   **Event Registrations:** Max 10 requests per minute to prevent registration script bots.

---

## 5. Data & Input Validation

### 5.1 Schema Validation (Zod)
Every REST endpoint must validate both the query params and the request body before invoking the database context.
*   **Validation Rule:** Any payload containing extra/unrecognized fields must be stripped (strict parsing) to prevent mass-assignment vulnerabilities.
*   **Sanitisation:** String elements must undergo HTML entity encoding and trimming to prevent Cross-Site Scripting (XSS) injections.

### 5.2 File Upload Security
Version 1.0 supports image uploads for CMS graphics and products. The following validations must be run:
*   **Magic Number Check:** The system must inspect the file header's magic bytes to verify MIME types (e.g., `image/png`, `image/jpeg`). Do not trust the file extension string.
*   **File Size Restriction:** Strict limit of 5MB per upload.
*   **Execution Isolation:** Uploaded files must be renamed using UUIDs and stored inside isolated Object Storage (like AWS S3) with public executions disabled. Files must never be stored directly in the server's executable local filesystem directories.

---

## 6. Audit Logging

To ensure non-repudiation, a dedicated transaction log database table must capture all state changes:
*   **Audited Events:** User role escalations, changes to security deposits, payment refunds, tournament bracket score updates, and inventory transitions to 'Damaged'.
*   **Log Structure:**
    ```json
    {
      "id": "uuid",
      "timestamp": "iso_date",
      "operator_id": "user_uuid",
      "ip_address": "v4_v6_string",
      "action": "RENTAL_DEPOSIT_REFUNDED",
      "target_resource": "rentals/019067bc-15fc-73ea-90ab-a1f9a2e34cd9",
      "changes": {
        "old_state": { "status": "active" },
        "new_state": { "status": "returned" }
      }
    }
    ```
*   **Retention:** Audit records must be streamed to cloud watch collectors and retained for at least 7 years in read-only cold archives.

---

## 7. Configuration & Secrets Management

*   **Environment Variables:** Runtime configurations must be verified at startup using a strict schema check (e.g., Zod validator parsing `process.env`). If any variable is missing, the application must fail immediately.
*   **Secrets Storage:** Private database passwords, JWT verification strings, and payment API keys must never be committed to repository code files. Production setups must retrieve these variables dynamically from secure cloud vaults (e.g., Vercel Secrets, AWS Secrets Manager, or Doppler Key Vault).

---

## 8. Backup & Disaster Recovery Security

*   **Database Backups:** Daily full snapshots and Point-in-Time-Recovery (PITR) transaction logs must be stored in geographically separated read-only cloud buckets.
*   **Encryption:** Backups must be encrypted before transmission using GPG with 4096-bit public keys.
*   **Verification:** Monthly dry runs must verify backup restoration capabilities onto isolated sandbox databases.
