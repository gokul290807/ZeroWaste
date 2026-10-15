# ZeroWaste - Project Status & Technical Inspection

**Inspection Date:** October 13, 2026  
**Repository:** `ZeroWaste`  
**Stack:** Node.js, Express, MongoDB / Mongoose, Vanilla HTML/CSS/JavaScript

---

## 1. Project Overview & Architecture

ZeroWaste is a full-stack sustainability platform connecting Households, Farmers, and NGOs to minimize food waste. It enables inventory tracking, surplus crop and food donations (supporting both complimentary free redistribution and cost-recovery value-based donations), scheduled pickups with Google Maps integration, payment tracking, and receipt generation.

### Current Project Structure

```
zerowaste/
├── PROJECT_STATUS.md                 # Project inspection and status documentation
├── backend/
│   ├── .env                          # Environment configuration (MONGODB_URI, secrets)
│   ├── .gitignore                    # Git ignore file
│   ├── data/
│   │   └── zerowaste_store.json      # Local JSON high-reliability storage engine
│   ├── db.js                         # Dual-engine database abstraction (Atlas + JSON failover)
│   ├── models/
│   │   ├── Crop.js                   # Farmer crop stock model
│   │   ├── CropDonation.js           # Farmer crop donation & lifecycle model
│   │   ├── Donation.js               # Household food donation & lifecycle model
│   │   ├── Food.js                   # Household inventory food model
│   │   └── User.js                   # User account model (household, farmer, ngo)
│   ├── node_modules/                 # Node dependencies
│   ├── package.json                  # Backend dependencies & metadata
│   ├── package-lock.json             # Locked dependency versions
│   ├── server.js                     # Express API server & static file host (Port 3000)
│   └── services/
│       └── paymentService.js         # Payment & reimbursement abstraction layer
└── public/
    ├── dashboard.html                # Multi-role interactive dashboard
    ├── index.html                    # Public landing page
    ├── login.html                    # Login page with 1-click presentation demo switch
    ├── register.html                 # User registration page
    ├── script.js                     # Main client-side application logic
    └── style.css                     # Responsive styling & design system
```

---

## 2. Features Already Implemented

### Authentication & Role Management
- **User Registration (`POST /api/register`):** Creates accounts with bcrypt password hashing; supports roles (`household`, `farmer`, `ngo`), contact numbers, and pickup addresses.
- **User Login (`POST /api/login`):** Validates credentials using `bcrypt.compare`; returns user profile.
- **Client Session Management:** Session cached securely with JWT token in `localStorage`; automatically populates forms and role views. Unauthenticated access redirects cleanly to `login.html`.
- **Role-Based Workflows:** Distinct UI interfaces and capabilities for `household`, `farmer`, and `ngo` roles.

### Household Food Inventory & Expiry Management
- **Add Food (`POST /api/foods`):** Logs item name, quantity, unit, category, and expiry date.
- **Inventory Display (`GET /api/foods/:email`):** Calculates remaining shelf-life days and dynamically badges status (`Fresh`, `Expires in X day(s)`, `Expired`).
- **Quick Donate Action:** Transfers food inventory item details directly into the donation creation form.
- **Delete Food (`DELETE /api/foods/:id`):** Removes items from inventory.
- **AI Expiry Assistant:** Automatically scans inventory to display urgency warnings, meal suggestions, and food preservation advice.

### Farmer Crop Produce Management
- **Add Unsold Produce (`POST /api/crops`):** Records crop name, harvest quantity, unit, availability date, farm location, and description.
- **Produce Stock View (`GET /api/crops/:email`):** Lists active farm produce items.
- **Quick Donate Crop:** Bridges farm produce into crop donation workflow.
- **Delete Crop (`DELETE /api/crops/:id`):** Deletes crops from stock.

### Food & Crop Donation Lifecycle (6-Stage Pipeline)
The system supports both **Free Community Donations** (₹0 complimentary hunger relief) and **Value-Based Donations** (cost recovery with expected/agreed INR valuation). Both Food and Crop donations follow a synchronized 6-stage lifecycle:

1. **Available (`available`):**
   - Published by donor with photo samples or file upload, pickup location, and valuation.
   - Visible to NGOs in public browse feed.
2. **Requested (`requested`):**
   - NGO requests the donation (`PUT /api/donations/:id/request`, `/api/crop-donations/:id/request`).
   - Donor is notified with NGO contact details and optional collection note.
3. **Accepted (`accepted`):**
   - Donor reviews request, enters agreed valuation amount (for value-based donations), and accepts (`PUT .../accept`) or declines (`PUT .../reject`).
4. **Collection Scheduled (`collection_scheduled`):**
   - Either party specifies pickup date, pickup time, and location coordinates (`PUT .../schedule`).
   - Integrated Google Maps directions link (`https://www.google.com/maps/dir/?api=1&destination=...`).
5. **Collected (`collected`):**
   - NGO confirms physical handover on site via confirmation dialog (`PUT .../collect`).
6. **Completed (`completed`):**
   - Final transaction completion (`PUT .../complete`). Generates unique electronic receipt ID (e.g., `ZW-2026-XXXXXX`).

### Audit Trail & Timeline History
- Every lifecycle update appends an immutable entry to the donation's `timeline` array containing the event name, ISO timestamp, description details, and actor.
- Expandable "Timeline" audit drawer on each donation card displays full verification history.

### Financial Reimbursement & Payment Service
- Extensible `paymentService.js` abstraction.
- Payment recording dialog for value-based donations (`PUT .../payment`) supporting Cash Reimbursement, UPI, and Bank Transfer with transaction reference generation.
- Official printable donation receipt modal with print/save as PDF support and verification watermark.

### Real-Time Analytics & Dashboard Metrics
- **Donor Analytics (`GET /api/stats/donor/:email`):** Total donations count, kg of food donated, kg of crops donated, total donation value (₹), completed donations count, and pending payments.
- **NGO Analytics (`GET /api/stats/ngo/:email`):** Requested count, accepted count, collected count, completed count, total food received (kg), total crops received (kg), and total distributed value (₹).

### Dual-Engine High-Reliability Storage Architecture
- Connects to MongoDB Atlas via Mongoose with a 2.5-second connection timeout guard.
- Seamless automatic fallback to a Local File-Based Storage Engine (`backend/data/zerowaste_store.json`) using Mongoose-compatible Dynamic Model Proxies.
- Prevents server crashes and presentation downtime if network connectivity or IP whitelisting fails.
- Seed demo data utility (`POST /api/demo/reset`) restores clean presentation state on demand.

---

## 3. Current Project Status & Recent Improvements

1. **Demo Content & Switcher Removal (Completed):**
   - Removed automatic mock login fallback from `dashboard.html`. Unauthenticated requests redirect cleanly to `login.html`.
   - Removed presentation switcher toolbar and buttons from UI and styles.
   - Removed presentation mock notes from payment modal and receipt footer.
2. **Real Dashboard Analytics (Completed):**
   - Connected Household Quick Stats (`Active Donations`, `Food Redistributed`) directly to backend donor statistics and active donation computations.
   - Connected Donor Transaction Summary and NGO Reception Metrics directly to live database records via `/api/stats/donor/:email` and `/api/stats/ngo/:email`.
3. **Landing Page Navigation (Completed):**
   - `getStarted()` and `learnMore()` handlers are implemented and operational in `script.js`.
4. **Backend Scripts & Main (Completed):**
   - Standardized `backend/package.json` with `"start": "node server.js"` and `"main": "server.js"`.
5. **Session & Token Verification (Completed):**
   - JWT authentication guards protected routes against unauthorized cross-user access.
6. **Items for Attention / Future Enhancements:**
   - **Atlas Cloud Sync:** MongoDB Atlas IP whitelist can be configured in MongoDB Atlas dashboard if cloud synchronization is preferred over the local high-reliability JSON store.
   - **Frontend Cancellation Dialog:** Add explicit UI button to invoke `/api/donations/:id/cancel` directly from donor card when listing is in `available` state.

---

## 4. Database Configuration & Status

- **Configuration:** Environment variable `MONGODB_URI` is stored securely in `backend/.env`.
- **Cloud Connection Status (MongoDB Atlas):** Connection attempts to MongoDB Atlas currently time out (`serverSelectionTimeoutMS: 2500`) due to network firewall or IP access list restrictions on the cluster.
- **Fallback Status:** The system smoothly activates the **Local High-Reliability Storage Engine** (`backend/data/zerowaste_store.json`). All CRUD operations, filtering, queries, and updates function correctly without data loss.
- **Action Required for Atlas Cloud Sync:** To use MongoDB Atlas cloud storage directly, the user must add their current IP address (or `0.0.0.0/0`) in MongoDB Atlas > *Network Access* > *IP Access List*.

---

## 5. How to Run the Project

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Running the Application

1. Open a terminal in the `backend` folder:
   ```powershell
   cd c:\Users\Admin\OneDrive\Desktop\zerowaste\backend
   ```
2. Start the Express server:
   ```powershell
   node server.js
   ```
3. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
4. Access direct pages:
   - **Landing Page:** `http://localhost:3000/index.html`
   - **Login Page:** `http://localhost:3000/login.html`
   - **Dashboard:** `http://localhost:3000/dashboard.html`

---

## 6. Next Recommended Implementation Steps

Prioritized list of recommended improvements (awaiting user approval before making any code modifications):

1. **Fix Landing Page Navigation:**
   - Add `getStarted()` (navigates to `login.html` or `register.html`) and `learnMore()` (scrolls smoothly to `#about` or `#features`) in `public/script.js`.
2. **Standardize `backend/package.json`:**
   - Add `"start": "node server.js"` script and point `"main"` to `"server.js"`.
3. **Add Frontend Cancellation Action:**
   - Add a "Cancel Donation" button on donor cards when in `available` or `requested` status, hooked into `/api/donations/:id/cancel` and `/api/crop-donations/:id/cancel`.
4. **Configure MongoDB Atlas Whitelist (If Cloud Sync Desired):**
   - Whitelist the current development IP in the MongoDB Atlas dashboard.
5. **Security & Session Hardening (Optional / Next Milestone):**
   - Implement JWT token-based authentication on Express routes for production readiness.
