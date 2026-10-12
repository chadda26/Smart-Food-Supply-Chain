# Smart Food Supply Chain and Waste Reduction System

A full-stack, enterprise-grade web application engineered to eliminate edible food waste by interconnecting Food Providers (restaurants, hotels, supermarkets), NGOs/Food Banks, and Logistics Distributors under administrative oversight.

---

## 🌟 Key Platform Capabilities

- **Strict Role-Based Access Control (RBAC)**: Distinct, isolated dashboard workflows for **Food Providers**, **NGOs / Food Banks**, **Distributors / Drivers**, and **System Administrators**.
- **Surplus Food Batch Management**: Complete registration of prepared meals, bakery surplus, raw produce, and dairy with automated expiration tracking and temperature requirements.
- **Administrative Safety Verification**: Verification workflow ensuring temperature compliance and hygiene standards before food is matched.
- **Rule-Based NGO Matching Engine**: Transparent, multi-factor algorithmic matching evaluating proximity (Haversine formula), storage capacity, urgency, and availability status.
- **Live Geolocation Tracking & Telemetry**: Real-time browser GPS tracking with interactive Leaflet maps, simulated transit fallback, and distance calculations.
- **Double-Verification Handoff Protocol**:
  - **Pickup Verification**: Driver verifies condition and temperature reading at donor kitchen with a 4-digit code.
  - **Delivery Verification**: Receiving NGO inspects condition and confirms weight or logs disputes.
- **Immutable Traceability Timeline**: Complete chronological audit trail tracking every touchpoint from kitchen creation to community distribution.
- **Verified ESG & Sustainability Analytics**: Automatic real-time computation of food rescued (kg), community meals delivered, landfill methane diversion, and CO₂e emission reductions.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React
- **Interactive Mapping**: Leaflet & OpenStreetMap with HTML5 Geolocation API
- **Charts & Visualization**: Recharts
- **Backend & API**: Next.js Route Handlers with Centralized Error Handling
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication & Security**: Secure HTTP-only cookie sessions with Jose (JWT) & Bcrypt password hashing
- **Validation**: Zod Schema Validation on all endpoints
- **Testing**: Node Test Runner

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Server running locally or in the cloud

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/smart_food_db?schema=public"
JWT_SECRET="your-secure-jwt-secret-key-here-minimum-32-characters"
NEXT_PUBLIC_APP_NAME="Smart Food Supply Chain"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Migration & Schema Push
```bash
npx prisma db push
```

### 4. Seed Realistic Demo Data
```bash
node prisma/seed.js
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Automated Test Suite
```bash
npm test
```

---

## 🔑 Demo Accounts

All demo accounts use the standard password: `Demo@1234`

| Role | Email | Organization / Description |
| :--- | :--- | :--- |
| **System Admin** | `admin@foodchain.org` | Platform Administrator |
| **Food Provider** | `provider@abcrestaurant.com` | ABC Grand Restaurant |
| **Food Provider** | `greenleaf@hotel.com` | Green Leaf Luxury Hotel |
| **NGO / Food Bank**| `contact@helpinghands.org` | Helping Hands Community Food Bank |
| **NGO / Food Bank**| `relief@foodsupport.org` | Food Support Foundation |
| **Distributor** | `rahul.kumar@fooddist.com` | Delivery Van Driver |
| **Distributor** | `amit.sharma@logistics.com` | Temperature-Controlled Truck Driver |

---

## 🏛️ System Architecture & Workflow

```
[Food Provider] ---> [Draft / Submit Donation]
                            |
                            v
[System Admin]   ---> [Safety Review & Approval]
                            |
                            v
[NGO Partner]    ---> [Browse Surplus & Request Allocation]
                            |
                            v
[Matching Engine]---> [Multi-Factor Scoring (Distance, Capacity, Urgency)]
                            |
                            v
[Admin Dispatch] ---> [Assign Logistics Driver]
                            |
                            v
[Distributor]    ---> [Pickup Verification (Code & Temp Check)]
                            |
                            v
[Live GPS Stream]---> [Real-Time Transit Tracking on Leaflet Map]
                            |
                            v
[NGO Partner]    ---> [Delivery Verification & Quality Feedback]
                            |
                            v
[Impact Engine]  ---> [Update Traceability Timeline & ESG Metrics]
```

---

## 📄 License
This project is developed for educational and production supply chain management.