/**
 * StockPulse NextGen - Secure Centralized REST API Service
 * Supports Python Flask, Node.js Express, and Zero-Configuration GitHub Pages Static Deployments
 */

// Universal HTML sanitizer to completely neutralize Cross-Site Scripting (XSS)
const SecurityUtil = {
    escapeHTML(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // Sanitize numerical inputs to prevent NaN or negative injections
    sanitizeNumber(val, defaultVal = 0, allowNegative = false) {
        const num = parseFloat(val);
        if (isNaN(num)) return defaultVal;
        return allowNegative ? num : Math.max(0, num);
    },

    // Rate Limiting Defense for Brute-Force Authentication Protection
    checkRateLimit(key = 'login', maxAttempts = 5, windowMs = 60000) {
        const now = Date.now();
        const records = JSON.parse(sessionStorage.getItem(`rate_limit_${key}`) || '[]');
        const validRecords = records.filter(timestamp => now - timestamp < windowMs);

        if (validRecords.length >= maxAttempts) {
            const oldest = validRecords[0];
            const remainingSec = Math.ceil((windowMs - (now - oldest)) / 1000);
            return { blocked: true, remainingSec };
        }

        validRecords.push(now);
        sessionStorage.setItem(`rate_limit_${key}`, JSON.stringify(validRecords));
        return { blocked: false };
    },

    resetRateLimit(key = 'login') {
        sessionStorage.removeItem(`rate_limit_${key}`);
    }
};

const ApiService = {
    isOnlineBackend: false,
    apiBase: 'api', // Relative path works both on localhost:5000 and behind subpaths

    async init() {
        try {
            // Check if backend API server is active
            const res = await fetch(`${this.apiBase}/health`, { method: 'GET', cache: 'no-cache' });
            if (res.ok) {
                this.isOnlineBackend = true;
                console.log('✓ StockPulse backend API connected.');
                return;
            }
        } catch (e) {
            // Quiet fallback for GitHub Pages and standalone file hosting
        }
        this.isOnlineBackend = false;
        console.log('ℹ StockPulse running in Zero-Setup Offline / GitHub Pages Mode.');
    },

    // Authentication Endpoints
    async login(email, password) {
        const rateCheck = SecurityUtil.checkRateLimit('login', 5, 45000);
        if (rateCheck.blocked) {
            throw new Error(`Too many login attempts. Locked for security. Try again in ${rateCheck.remainingSec}s.`);
        }

        const safeEmail = SecurityUtil.escapeHTML((email || '').trim().toLowerCase());

        if (this.isOnlineBackend) {
            const res = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: safeEmail, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Authentication failed');
            SecurityUtil.resetRateLimit('login');
            return data;
        } else {
            // Local fallback authentication
            const users = JSON.parse(localStorage.getItem('stockpulse_users') || '[]');
            const user = users.find(u => u.email.toLowerCase() === safeEmail);

            // Pre-configured evaluation demo accounts
            if (!user && (safeEmail === 'admin@stockpulse.io' || safeEmail === 'manager@stockpulse.io' || safeEmail === 'specialist@stockpulse.io')) {
                const demoUser = {
                    id: 'usr-demo-' + safeEmail.split('@')[0],
                    name: safeEmail.includes('admin') ? 'Warehouse Admin' : (safeEmail.includes('manager') ? 'Elena Rodriguez' : 'Marcus Vance'),
                    email: safeEmail,
                    role: safeEmail.includes('admin') ? 'System Admin' : (safeEmail.includes('manager') ? 'Warehouse Manager' : 'Inventory Specialist')
                };
                SecurityUtil.resetRateLimit('login');
                return { user: demoUser, token: 'demo-token-' + Date.now() };
            }

            if (!user) throw new Error('Account not found. Please create an account.');
            if (user.password !== password) throw new Error('Incorrect password. Please verify credentials.');

            SecurityUtil.resetRateLimit('login');
            return { user, token: 'local-token-' + Date.now() };
        }
    },

    async register(name, email, password, role) {
        const safeName = SecurityUtil.escapeHTML(name.trim());
        const safeEmail = SecurityUtil.escapeHTML(email.trim().toLowerCase());
        const safeRole = SecurityUtil.escapeHTML(role || 'Inventory Specialist');

        if (this.isOnlineBackend) {
            const res = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: safeName, email: safeEmail, password, role: safeRole })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');
            return data;
        } else {
            const users = JSON.parse(localStorage.getItem('stockpulse_users') || '[]');
            if (users.some(u => u.email.toLowerCase() === safeEmail)) {
                throw new Error('An account with this email address already exists.');
            }
            const newUser = {
                id: 'usr-' + Date.now(),
                name: safeName,
                email: safeEmail,
                password,
                role: safeRole,
                createdAt: new Date().toISOString()
            };
            users.push(newUser);
            localStorage.setItem('stockpulse_users', JSON.stringify(users));
            return { user: newUser, token: 'local-token-' + Date.now() };
        }
    },

    // Product Catalog Endpoints
    async getProducts() {
        if (this.isOnlineBackend) {
            const res = await fetch(`${this.apiBase}/products`);
            if (!res.ok) throw new Error('Failed to retrieve catalog from backend server');
            return await res.json();
        } else {
            const cached = localStorage.getItem('stockpulse_products_v3');
            return cached ? JSON.parse(cached) : null;
        }
    },

    async saveProduct(product) {
        // Sanitize all fields
        const safeProduct = {
            ...product,
            name: SecurityUtil.escapeHTML(product.name || 'Unnamed Product'),
            sku: SecurityUtil.escapeHTML((product.sku || '').toUpperCase()),
            category: SecurityUtil.escapeHTML(product.category || 'Electronics'),
            cost: SecurityUtil.sanitizeNumber(product.cost, 0),
            price: SecurityUtil.sanitizeNumber(product.price, 0),
            quantity: Math.round(SecurityUtil.sanitizeNumber(product.quantity, 0)),
            threshold: Math.max(1, Math.round(SecurityUtil.sanitizeNumber(product.threshold, 5))),
            image: (product.image || '').trim(),
            lastUpdated: new Date().toISOString()
        };

        if (this.isOnlineBackend) {
            const isEdit = !!safeProduct.id;
            const url = isEdit ? `${this.apiBase}/products/${safeProduct.id}` : `${this.apiBase}/products`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(safeProduct)
            });
            if (!res.ok) throw new Error('Failed to persist product');
            return await res.json();
        } else {
            let products = JSON.parse(localStorage.getItem('stockpulse_products_v3') || '[]');
            if (safeProduct.id) {
                const idx = products.findIndex(p => p.id === safeProduct.id);
                if (idx !== -1) products[idx] = safeProduct;
            } else {
                safeProduct.id = 'prod-' + Date.now() + Math.random().toString(36).substr(2, 4);
                products.unshift(safeProduct);
            }
            localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
            return safeProduct;
        }
    },

    async deleteProduct(id) {
        if (this.isOnlineBackend) {
            const res = await fetch(`${this.apiBase}/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Server delete failed');
            return await res.json();
        } else {
            let products = JSON.parse(localStorage.getItem('stockpulse_products_v3') || '[]');
            products = products.filter(p => p.id !== id);
            localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
            return { success: true };
        }
    },

    async adjustStock(id, delta, exact, reason) {
        if (this.isOnlineBackend) {
            const res = await fetch(`${this.apiBase}/products/${id}/adjust`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delta, exact, reason: SecurityUtil.escapeHTML(reason) })
            });
            if (!res.ok) throw new Error('Failed to adjust stock');
            return await res.json();
        } else {
            let products = JSON.parse(localStorage.getItem('stockpulse_products_v3') || '[]');
            const idx = products.findIndex(p => p.id === id);
            if (idx === -1) throw new Error('Product not found');

            let newQty = exact !== undefined && exact !== null 
                ? SecurityUtil.sanitizeNumber(exact, 0)
                : SecurityUtil.sanitizeNumber(products[idx].quantity || 0, 0) + Number(delta);
            newQty = Math.max(0, Math.round(newQty));

            products[idx].quantity = newQty;
            products[idx].lastUpdated = new Date().toISOString();
            localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
            return products[idx];
        }
    }
};

window.SecurityUtil = SecurityUtil;
window.ApiService = ApiService;
