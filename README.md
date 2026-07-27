
# Nyabihu Christian Academy (NCA) — Online Admission Portal

> **Educate A Child, Transform A Generation.**

A complete, professional online admission management system for Nyabihu Christian Academy, built with **pure HTML + CSS + JavaScript** and **Supabase** as the backend database. No frameworks, no build tools — just open and run.

---

## ✨ Features

### 🧑‍🎓 Parent / Public Portal (`index.html`)

| Feature | Details |
|---------|---------|
| **Admission Form** | Apply for Nursery One (Baby Class), Academic Year 2026–2027 |
| **Birth Certificate Upload** | Supports PDF, JPG, JPEG, PNG — max 100 MB (stored as base64) |
| **Age Verification** | Child must be at least 3 years old (validated on submission) |
| **Success Screen** | Clean confirmation after submission |
| **Application Status Checker** | `parent-check.html` — parents track application using app number + parent ID + phone |
| **Responsive Design** | Works on desktop, tablet, and mobile |
| **Sticky Navigation** | Top bar, main header, sticky nav with sections: Home, About Us, Apply, Check Status, Announcements, Contact |
| **Admin Login Link** | Quick access for administrators (top bar) |

### 🔐 Administrator Dashboard (`admin.html`)

| Feature | Details |
|---------|---------|
| **Secure Login** | Email + password authentication with localStorage session |
| **Dashboard Overview** | 6 stat cards (total, pending, admitted, rejected, today, this week), 3 interactive Chart.js charts (district bar, gender doughnut, daily line), recent applications table |
| **Applications Management** | Search, filter by status/district/cell, paginated table, bulk admit/reject/export/print/delete |
| **Application Detail Modal** | Full details, document preview/download, status management, inline messaging |
| **Communication Center** | 4 tabs: Announcements (CRUD), Messages, Templates (6 pre-built), History |
| **Reports Export** | Export filtered applications to Excel (.xlsx), PDF, or CSV |
| **Notifications** | Bell icon with badge count, dropdown list |
| **Admin Profile** | Profile dropdown with logout |
| **Dark Mode** | Toggleable dark/light theme — persists across sessions |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3 (Custom Properties, Grid, Flexbox) |
| **Charts** | [Chart.js](https://www.chartjs.org/) |
| **Icons** | [Font Awesome 6](https://fontawesome.com/) |
| **Font** | [Poppins](https://fonts.google.com/specimen/Poppins) — Google Fonts |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL + REST API) |
| **Auth** | localStorage-based session management |

---

## 📁 Project Structure

```
site/
├── index.html                # Public admission form page
├── login.html                # Admin login page
├── admin.html                # Admin dashboard (all management tools)
├── parent-check.html         # Public application status checker
├── css/
│   └── styles.css            # Complete stylesheet (~3950 lines, design system + dark mode)
├── js/
│   ├── config.js             # Supabase connection (URL + anon key)
│   ├── auth.js               # Admin login/logout/session logic
│   ├── admission-form.js     # Form validation, file upload, Supabase insert
│   ├── admin-dashboard.js    # Dashboard, CRUD, charts, export, bulk actions
│   └── communication.js      # Announcements, messaging, templates, timeline
├── IMAGES/
│   └── logo.jpeg             # School logo
├── setup.sql                 # SQL schema — admissions table + RLS policies
├── setup-comm.sql            # SQL schema — communication tables + RLS policies
└── README.md                 # This file
```

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/valentinuwi-crypto/NCA-Admission-Form.git
cd NCA-Admission-Form/site
```

> **No build tools or servers required.** Just serve the files with any static file server (or open directly in a browser).

### 2. Configure Supabase

Open `js/config.js` and replace the credentials with your own Supabase project details:

```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_KEY = "sb_publishable_your-anon-key";
```

> You can get these from **Supabase Dashboard → Settings → API**.

### 3. Create Database Tables

Go to **Supabase Dashboard → SQL Editor**, paste and run the SQL scripts in this order:

1. **`setup.sql`** — Creates the `admissions` table with all columns (application number, child info, parent info, address, birth certificate, status, timestamps) and Row-Level Security (RLS) policies
2. **`setup-comm.sql`** — Creates `announcements`, `messages`, and `status_history` tables for the communication module with RLS policies

### 4. Set Admin Credentials

Open `js/auth.js` and update the admin account:

```javascript
var ADMIN_EMAIL = "youremail@example.com";
var ADMIN_PASSWORD = "your-password";
```

### 5. Open the Application

Open `index.html` in any modern browser.

---

## 📄 Page Reference

| Page | URL | Description |
|------|-----|-------------|
| **Admission Form** | `index.html` | Public-facing application for parents to submit admission requests |
| **Admin Login** | `login.html` | Authentication page for administrators |
| **Admin Dashboard** | `admin.html` | Full management panel with analytics, applications, communication, reports |
| **Status Checker** | `parent-check.html` | Public page where parents check application status in real time |

---

## 🗄 Database Schema

### `admissions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID` | Primary key (auto-generated) |
| `app_number` | `TEXT` | Unique application number (e.g., NCA-2026-0001) |
| `child_full_name` | `TEXT` | Full name of the child applicant |
| `gender` | `TEXT` | Male / Female |
| `date_of_birth` | `DATE` | Child's date of birth |
| `applying_class` | `TEXT` | Class applying for |
| `father_full_name` | `TEXT` | Father's full name |
| `father_national_id` | `TEXT` | Father's national ID number |
| `father_phone` | `TEXT` | Father's phone number |
| `mother_full_name` | `TEXT` | Mother's full name |
| `mother_national_id` | `TEXT` | Mother's national ID number |
| `mother_phone` | `TEXT` | Mother's phone number |
| `province` | `TEXT` | Province of residence |
| `district` | `TEXT` | District of residence |
| `sector` | `TEXT` | Sector of residence |
| `cell` | `TEXT` | Cell of residence |
| `village` | `TEXT` | Village of residence |
| `birth_certificate_name` | `TEXT` | Original filename of uploaded birth certificate |
| `birth_certificate_data` | `TEXT` | Base64-encoded file content |
| `status` | `TEXT` | Application status: `Pending`, `Admitted`, or `Not Admitted` |
| `created_at` | `TIMESTAMPTZ` | Submission timestamp (auto-set) |

### Communication Tables

| Table | Description |
|-------|-------------|
| `announcements` | School announcements with title, message, category, priority level, target audience, publish/expiry dates, status |
| `messages` | Direct messaging between admin and parents, linked to specific applications |
| `status_history` | Timeline log of all status changes for each application |

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `#0D47A1` | Main brand color, headers, buttons |
| **Accent / Gold** | `#F9A825` | Highlights, badges, hover states |
| **Success** | `#2E7D32` | Admitted status, success indicators |
| **Danger** | `#D32F2F` | Rejected status, delete actions |
| **Background** | `#F5F7FA` | Page background |
| **Font** | Poppins | All text — Google Fonts |
| **Border Radius** | 10px (buttons), 12px (cards) | UI element rounding |
| **Icons** | Font Awesome 6 | All icons across the site |

**Dark Mode**: Full dark theme with 80+ custom CSS variables for colors, backgrounds, borders, and shadows. Toggle persists via `localStorage`.

---

## 🌐 Browser Support

- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+ (macOS / iOS)

---

## 📸 Screenshots

*(Add screenshots here after deployment)*

| Page | Preview |
|------|---------|
| Admission Form | — |
| Admin Dashboard | — |
| Status Checker | — |

---

## 🔒 Security Notes

- Admin dashboard is protected by login — unauthenticated users are redirected to `login.html`
- No admin links are visible to the public on the parent portal
- Supabase Row-Level Security (RLS) policies prevent unauthorized database access
- Birth certificates are stored as base64 — consider switching to Supabase Storage for production

---

## 🤝 Contributing

This is a proprietary project developed for **Nyabihu Christian Academy**. For inquiries or contributions, please contact the school administration.

---

## 📞 Contact

| | |
|---|----|
| **📍 Address** | Nyabihu District, Western Province, Rwanda |
| **📞 Phone** | +250 785 453 082 |
| **✉️ Email** | valentinuwi@gmail.com |
| **🌐 Website** | *(coming soon)* |

---

## 📄 License

**Proprietary** — All rights reserved.  
Developed exclusively for **Nyabihu Christian Academy (NCA)**.
