# 📦 StockPulse NextGen (v3.2 Secure Edition)
### Smart Inventory, Barcode & Warehouse Operating System

An enterprise-grade, modern NextGen web application built with an earthy aesthetic, responsive UI micro-interactions, full authentication, real-time stock control, barcode shelf-tag generation, multi-select batch operations, and universal zero-setup GitHub Pages compatibility.

---

## 🎨 Theme Palette Specification
Built strictly around the required earthy color tones:
* **Tea Green** (`#ccd5ae`): In-Stock badges, active category pills, success alerts, brand emblem
* **Beige** (`#e9edc9`): Card header backgrounds, subtle secondary borders, hover states
* **Cornsilk** (`#fefae0`): Modal headers, warm card surfaces, form backgrounds
* **Papaya Whip** (`#faedcd`): Low-stock warning indicators, reorder chips, margin preview cards
* **Light Bronze** (`#d4a373`): Primary action buttons, brand gradients, focus rings, price metrics
* **Deep Earth Tones** (`#261f18`, `#5b3917`): High-contrast text meeting WCAG AAA accessibility standards

---

## 📁 Modular Project Architecture
All code has been separated into clean, production-ready modules:

```
stockpulse-app/
├── index.html                 # Main Dashboard (Root - GitHub Pages ready)
├── login.html                 # Auth Portal (Root - GitHub Pages ready)
├── css/                       # Modular CSS (Theme, Animations, Auth)
├── js/                        # Modular JS (API, Auth, App)
├── app.py                     # Python Flask REST API backend + SQLite database
├── server.js                  # Node.js Express REST API backend alternative
├── requirements.txt           # Python dependencies (Flask, Gunicorn)
├── package.json               # Node.js dependencies (Express)
├── Procfile                   # Cloud process file (Render / Railway / Heroku)
├── Dockerfile                 # Universal Docker container configuration
├── render.yaml                # 1-Click Render blueprint configuration
├── .nojekyll                  # GitHub Pages static asset bypass
├── .github/workflows/         # Automated GitHub Actions deployment to GitHub Pages
│   └── deploy.yml
└── public/                    # Synced static files mirror
```

---

## 🛡️ Enterprise Security Hardening
1. **XSS Neutralization**: All user-supplied data (names, categories, SKUs, notes) is passed through `SecurityUtil.escapeHTML()` prior to DOM injection.
2. **Brute-Force Rate Limiting**: Intelligent lockout protection prevents credential stuffing by locking authentication for 45s after 5 consecutive failed attempts.
3. **HTTP Security Headers**:
   * `X-Content-Type-Options: nosniff`
   * `X-Frame-Options: SAMEORIGIN` (Clickjacking defense)
   * `X-XSS-Protection: 1; mode=block`
   * `Referrer-Policy: strict-origin-when-cross-origin`
4. **SQL Parameterization**: SQLite queries in `app.py` use parameterized tuples preventing SQL injection.
5. **Numerical Sanitization**: Quantity, cost, and price values are strictly clamped and sanitized against `NaN` and negative injections.

---

## ✨ NextGen Features & Animations

### 1. 🌟 Micro-Interactions & Animations
* **Ambient Floating Orbs**: Smooth floating glowing orbs in the background creating depth (`@keyframes floatOrb`).
* **Interactive Stock Health Bars**: Visual progress indicator on every item displaying current stock level relative to reorder threshold.
* **Multi-Select Batch Actions**: Floating toolbar for bulk operations (Restock +10, Bulk Delete).
* **Confetti Celebration**: Physics-based confetti burst when adding products or completing restocks.
* **Animated Sliding Auth Tabs**: Frictionless transition between *Sign In* and *Create Account* without page refresh.
* **Password Strength Meter**: Real-time animated progress bar indicating password complexity.
* **Card Interactive Physics**: Micro-elevation with a soft bronze glow on hover.
* **Critical Stock Pulse**: Breathing animation on low-stock items requiring urgent warehouse attention.
* **Live Status Dot**: Animated radar ping on in-stock inventory items.

### 2. 🔐 Authentication & Role Management
* **Demo Evaluation Accounts**:
  * **Manager**: `manager@stockpulse.io` / `demo1234`
  * **Admin**: `admin@stockpulse.io` / `demo1234`
  * **Specialist**: `specialist@stockpulse.io` / `demo1234`
* 1-Click Demo Profile buttons for instant testing.
* Route Guarding: Protects inventory dashboard from unauthenticated sessions.
* User initials avatar and profile dropdown with instant role switching.

---

## 🌐 How to Publish to GitHub & GitHub Pages (Step-by-Step)

Anyone in the world can open your app online directly via your free GitHub link:

### 1. Initialize Git & Push to GitHub
Open PowerShell in this folder and run:
```powershell
cd C:\Users\nevil\.gemini\antigravity\scratch\stockpulse-app

git init
git add .
git commit -m "feat: StockPulse NextGen v3.2 with Earthy Palette & Security"

# Link to your GitHub repository (replace with your repo URL)
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

### 2. Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (top tab) > **Pages** (left sidebar).
3. Under **Build and deployment**:
   * **Source**: Choose **Deploy from a branch**.
   * **Branch**: Select `main` and `/ (root)`.
   * Click **Save**.
4. In about 30 seconds, GitHub will give you your live URL:
   👉 **`https://<YOUR-USERNAME>.github.io/<YOUR-REPO-NAME>/`**

Anyone who clicks your GitHub link can instantly log in, manage inventory, print barcodes, and export data with zero setup!

---

## 🚀 How to Run Locally

### Option A: Python (Flask)
```powershell
cd C:\Users\nevil\.gemini\antigravity\scratch\stockpulse-app
pip install -r requirements.txt
python app.py
```
Open **`http://localhost:5000`** in your browser.

### Option B: Node.js (Express)
```powershell
cd C:\Users\nevil\.gemini\antigravity\scratch\stockpulse-app
npm install
npm start
```
Open **`http://localhost:5000`** in your browser.

### Option C: Standalone Double-Click
Double-click `index.html` or `login.html` directly in File Explorer. The application automatically detects that no server is running and switches to client-side persistence mode.
