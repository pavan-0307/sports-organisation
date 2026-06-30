# SportNest - RESTful API Interface & Contract Specification

**Document Reference:** SN-API-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Protocol:** HTTPS/REST  
**Default Payload Format:** JSON (`application/json`)  

---

## 1. Global Standards & Protocols

### 1.1 Base URL
All API calls must be sent to the following base endpoints:
*   **Staging Environment:** `https://staging-api.sportnest.com/v1`
*   **Production Environment:** `https://api.sportnest.com/v1`
*   **Local Development:** `http://localhost:4000/v1`

### 1.2 HTTP Headers
Every authenticated request must contain the following standard headers:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0
```

### 1.3 Standard Response Formats
To ensure predictable client parsing, all API endpoints must return data wrapped in standard structural envelopes:

#### Success Response Envelope (HTTP 200/201/202)
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:00.000Z",
  "data": {}
}
```

#### Error Response Envelope (HTTP 4xx/5xx)
```json
{
  "success": false,
  "timestamp": "2026-06-30T10:55:00.000Z",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body failed data validation.",
    "details": [
      {
        "field": "email",
        "issue": "Must be a valid email format."
      }
    ]
  }
}
```

### 1.4 API Error Codes Mapping

| Error Code | HTTP Status | Description |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired Bearer Token. |
| `FORBIDDEN` | 403 | Role-based check failed. Role has insufficient scope. |
| `NOT_FOUND` | 404 | Target resource ID does not exist or has been soft-deleted. |
| `CONFLICT` | 409 | Double-booking collision or duplicate unique key. |
| `VALIDATION_FAILED` | 422 | Payload fails schema type verification or boundary checks. |
| `GATEWAY_ERROR` | 502 | Payment processor or external API returned a failure. |

---

## 2. Authentication Subsystem (`/auth`)

### 2.1 Passwordless Login OTP Request
Initiates login sequence by transmitting a numeric verification token to the user.

*   **HTTP Method:** `POST`
*   **Path:** `/auth/login/otp-request`
*   **Authentication Required:** No
*   **Request Payload:**
```json
{
  "email": "customer@gmail.com"
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:01Z",
  "data": {
    "message": "Verification passcode has been transmitted via email.",
    "expires_at": "2026-06-30T11:05:01Z"
  }
}
```

### 2.2 Passwordless Login Verification
Verifies the numeric OTP and issues access tokens.

*   **HTTP Method:** `POST`
*   **Path:** `/auth/login/verify`
*   **Authentication Required:** No
*   **Request Payload:**
```json
{
  "email": "customer@gmail.com",
  "otp": "859624"
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:10Z",
  "data": {
    "user": {
      "id": "019067b5-24e5-79a4-a3cd-b956241a293b",
      "email": "customer@gmail.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTkwNjdiNS0yNGU1LTc5YTQtYTNjZC1iOTU2MjQxYTI5M2IiLCJyb2xlIjoiY3VzdG9tZXIiLCJleHAiOjE3ODMyODQ5MTB9.signature"
  }
}
```

---

## 3. Categories & Products Subsystem (`/products`)

### 3.1 Fetch Nested Category Hierarchy
*   **HTTP Method:** `GET`
*   **Path:** `/products/categories`
*   **Authentication Required:** No
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:15Z",
  "data": [
    {
      "id": "019067b8-15ac-7dfb-b9cd-90f75432ab88",
      "name": "Cricket Gear",
      "slug": "cricket-gear",
      "children": [
        {
          "id": "019067b8-18c2-7dfb-b9cd-90f75432ab89",
          "name": "Bats",
          "slug": "cricket-bats"
        }
      ]
    }
  ]
}
```

### 3.2 List Products (Retail & Rental Catalog)
*   **HTTP Method:** `GET`
*   **Path:** `/products`
*   **Query Parameters:**
    *   `category_slug` (string, optional)
    *   `type` (string: `retail` \| `rental` \| `hybrid`, optional)
    *   `page` (number, default: 1)
    *   `limit` (number, default: 20)
*   **Authentication Required:** No
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:20Z",
  "data": {
    "products": [
      {
        "id": "019067ba-4ac1-7dfb-90cb-22998ff6a39b",
        "name": "English Willow Cricket Bat",
        "slug": "english-willow-bat",
        "type": "hybrid",
        "retail_price": 250.00,
        "base_rental_rate": 15.00,
        "security_deposit": 100.00,
        "is_available": true
      }
    ],
    "pagination": {
      "total_count": 1,
      "page": 1,
      "limit": 20,
      "total_pages": 1
    }
  }
}
```

---

## 4. Equipment Rental Subsystem (`/rentals`)

### 4.1 Check Rental Slot Availability
Verifies if an item is available for a specified date range without locking it.

*   **HTTP Method:** `POST`
*   **Path:** `/rentals/check-availability`
*   **Authentication Required:** Yes
*   **Request Payload:**
```json
{
  "product_id": "019067ba-4ac1-7dfb-90cb-22998ff6a39b",
  "start_date": "2026-07-04T08:00:00Z",
  "end_date": "2026-07-05T18:00:00Z"
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:30Z",
  "data": {
    "is_available": true,
    "calculated_rental_fee": 30.00,
    "security_deposit_hold": 100.00,
    "total_due_online": 130.00
  }
}
```

### 4.2 Checkout Rental Booking
Creates a reserved rental booking and initiates card validation.

*   **HTTP Method:** `POST`
*   **Path:** `/rentals/checkout`
*   **Authentication Required:** Yes
*   **Request Payload:**
```json
{
  "product_id": "019067ba-4ac1-7dfb-90cb-22998ff6a39b",
  "start_date": "2026-07-04T08:00:00Z",
  "end_date": "2026-07-05T18:00:00Z",
  "payment_method_id": "pm_1FSp2e2eZuW5F8"
}
```
*   **Success Response (HTTP 201 Created):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:35Z",
  "data": {
    "rental_id": "019067bc-15fc-73ea-90ab-a1f9a2e34cd9",
    "status": "booked",
    "pickup_qr_code": "SN-RNT-019067bc-15fc-73ea-90ab-a1f9a2e34cd9",
    "charge_id": "ch_3NSd25Jp1Xy9qL"
  }
}
```

### 4.3 Log Rental Return Inspection (Staff Only)
Logs returned physical items, updates status, and processes deposits.

*   **HTTP Method:** `POST`
*   **Path:** `/rentals/:rental_id/inspect-return`
*   **Authentication Required:** Yes (Staff scope)
*   **Request Payload:**
```json
{
  "items": [
    {
      "inventory_unit_id": "019067bd-15ab-7dfb-b9cd-90f75432ab02",
      "condition_assessment": "excellent",
      "is_damaged": false,
      "charge_penalty": 0.00
    }
  ],
  "inspector_notes": "Return verified. Zero cosmetic damage."
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:40Z",
  "data": {
    "rental_id": "019067bc-15fc-73ea-90ab-a1f9a2e34cd9",
    "status": "returned",
    "security_deposit_released": 100.00,
    "penalty_charged": 0.00
  }
}
```

---

## 5. Sports Store Subsystem (`/store`)

### 5.1 Retail Checkout (Outright Purchase)
Processes purchasing transactions for new items.

*   **HTTP Method:** `POST`
*   **Path:** `/store/checkout`
*   **Authentication Required:** Yes
*   **Request Payload:**
```json
{
  "items": [
    {
      "product_id": "019067ba-4ac1-7dfb-90cb-22998ff6a39b",
      "quantity": 2
    }
  ],
  "payment_method_id": "pm_1FSp2e2eZuW5F8"
}
```
*   **Success Response (HTTP 201 Created):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:45Z",
  "data": {
    "order_id": "019067be-1cda-7aa9-90bc-a1e2f3d4d5e6",
    "status": "paid",
    "pickup_verification_qr": "SN-ORD-019067be-1cda-7aa9-90bc-a1e2f3d4d5e6",
    "total_amount": 500.00
  }
}
```

---

## 6. Payments & Webhooks Subsystem (`/payments`)

### 6.1 Stripe Webhook Event Processor
Asynchronously captures and verifies payment events from Stripe.

*   **HTTP Method:** `POST`
*   **Path:** `/payments/stripe-webhook`
*   **Authentication Required:** No (Signature verified via Header HMAC)
*   **Request Headers:**
```http
stripe-signature: t=1782813350,v1=9e8c2a13f7a4e6b5...
```
*   **Request Payload:**
```json
{
  "id": "evt_1FSp2e2eZuW5F8",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3NSd25Jp1Xy9qL",
      "amount": 13000,
      "currency": "usd",
      "metadata": {
        "rental_id": "019067bc-15fc-73ea-90ab-a1f9a2e34cd9"
      }
    }
  }
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:50Z",
  "data": {
    "processed": true,
    "event_id": "evt_1FSp2e2eZuW5F8"
  }
}
```

---

## 7. Tournament Events Subsystem (`/events`)

### 7.1 Join Tournament (Team Setup)
Creates a roster and captain link for a team-based sport event.

*   **HTTP Method:** `POST`
*   **Path:** `/events/:event_id/teams`
*   **Authentication Required:** Yes
*   **Request Payload:**
```json
{
  "team_name": "Warriors SC",
  "member_user_ids": [
    "019067b5-24e5-79a4-a3cd-b956241a293b",
    "019067c2-1cde-7dfa-b9bc-90a1f2b3c4d5",
    "019067c2-2abc-7dfa-b9bc-90a1f2b3c4d6"
  ],
  "payment_method_id": "pm_1FSp2e2eZuW5F8"
}
```
*   **Success Response (HTTP 201 Created):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:55:55Z",
  "data": {
    "team_id": "019067c3-1fda-7dfa-90ab-a1b2c3d4e5f6",
    "status": "approved",
    "registration_code": "REG-WAR-8596"
  }
}
```

### 7.2 Submit Match Score Result (Admin Only)
Saves completed match scores and compiles the next bracket node.

*   **HTTP Method:** `PUT`
*   **Path:** `/events/:event_id/matches/:match_id`
*   **Authentication Required:** Yes (Admin scope)
*   **Request Payload:**
```json
{
  "winner_id": "019067c3-1fda-7dfa-90ab-a1b2c3d4e5f6",
  "score": "3 - 1 (21-18, 19-21, 21-15, 21-17)",
  "status": "completed"
}
```
*   **Success Response (HTTP 200 OK):**
```json
{
  "success": true,
  "timestamp": "2026-06-30T10:56:00Z",
  "data": {
    "match_id": "019067c5-1abc-7dfa-90ab-a1c2d3e4f5g6",
    "status": "completed",
    "bracket_updated": true,
    "next_match_id": "019067c5-5def-7dfa-90ab-a1c2d3e4f5h7"
  }
}
```
