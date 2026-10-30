/**
 * StockPulse NextGen - Node.js Express REST Backend & Static Server
 * Can be deployed on Vercel, Render, Railway, Heroku, or run locally via `node server.js`
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = fs.existsSync(path.join(__dirname, 'public', 'index.html')) 
    ? path.join(__dirname, 'public') 
    : __dirname;
const DATA_FILE = path.join(__dirname, 'stockpulse_data.json');

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Load or Seed Data
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            console.error('Failed to parse data file:', e);
        }
    }
    const initialData = {
        users: [
            { id: 'usr-admin', name: 'Warehouse Administrator', email: 'admin@stockpulse.io', password: 'demo1234', role: 'Warehouse Admin' },
            { id: 'usr-mgr', name: 'Elena Rodriguez', email: 'manager@stockpulse.io', password: 'demo1234', role: 'Warehouse Manager' },
            { id: 'usr-spec', name: 'Marcus Vance', email: 'specialist@stockpulse.io', password: 'demo1234', role: 'Inventory Specialist' }
        ],
        products: [
            { id: 'prod-101', name: 'Keychron Q3 Pro Wireless Mechanical Keyboard', sku: 'TECH-8821', category: 'Electronics', cost: 130.00, price: 219.00, quantity: 14, threshold: 5, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-102', name: 'Herman Miller Style Ergonomic Lumbar Mesh Chair', sku: 'OFF-4029', category: 'Office Supplies', cost: 160.00, price: 289.50, quantity: 4, threshold: 6, image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-103', name: 'Double-Walled Insulated Thermal Tumbler 1.2L', sku: 'HDW-1092', category: 'Hardware', cost: 12.00, price: 34.99, quantity: 0, threshold: 10, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-104', name: 'Single Origin Ethiopian Heirloom Coffee Beans 1kg', sku: 'GRO-5541', category: 'Grocery', cost: 11.50, price: 24.50, quantity: 42, threshold: 12, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-105', name: 'Apex Precision OLED Smart Health Tracker Gen 5', sku: 'TECH-9910', category: 'Electronics', cost: 95.00, price: 179.00, quantity: 3, threshold: 6, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-106', name: 'Artisan Washed Organic Cotton Overshirt', sku: 'APP-3320', category: 'Apparel', cost: 32.00, price: 88.00, quantity: 22, threshold: 8, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() },
            { id: 'prod-107', name: 'Matte Ceramic Pour-Over Dripper & Server Set', sku: 'GRO-7712', category: 'Grocery', cost: 18.00, price: 45.00, quantity: 9, threshold: 5, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80', lastUpdated: new Date().toISOString() }
        ],
        auditLogs: []
    };
    saveData(initialData);
    return initialData;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', app: 'StockPulse NextGen', engine: 'Node.js Express', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = loadData();
    const user = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = `token_${user.id}_${Date.now()}`;
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    res.json({ user: safeUser, token });
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const db = loadData();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
        return res.status(409).json({ message: 'Account with this email already exists' });
    }
    const newUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: role || 'Inventory Specialist'
    };
    db.users.push(newUser);
    saveData(db);
    const token = `token_${newUser.id}_${Date.now()}`;
    res.status(201).json({ user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, token });
});

// Products Routes
app.get('/api/products', (req, res) => {
    const db = loadData();
    res.json(db.products);
});

app.post('/api/products', (req, res) => {
    const db = loadData();
    const newProduct = {
        id: `prod_${Date.now()}`,
        name: req.body.name,
        sku: req.body.sku.toUpperCase(),
        category: req.body.category || 'Electronics',
        cost: Number(req.body.cost) || 0,
        price: Number(req.body.price) || 0,
        quantity: Number(req.body.quantity) || 0,
        threshold: Number(req.body.threshold) || 5,
        image: req.body.image || '',
        lastUpdated: new Date().toISOString()
    };
    db.products.unshift(newProduct);
    saveData(db);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const db = loadData();
    const idx = db.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Product not found' });
    db.products[idx] = {
        ...db.products[idx],
        ...req.body,
        id: req.params.id,
        lastUpdated: new Date().toISOString()
    };
    saveData(db);
    res.json(db.products[idx]);
});

app.delete('/api/products/:id', (req, res) => {
    const db = loadData();
    db.products = db.products.filter(p => p.id !== req.params.id);
    saveData(db);
    res.json({ success: true, id: req.params.id });
});

app.post('/api/products/:id/adjust', (req, res) => {
    const db = loadData();
    const idx = db.products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Product not found' });
    
    const { delta, exact } = req.body;
    let newQty = exact !== undefined && exact !== null 
        ? Math.max(0, Number(exact)) 
        : Math.max(0, Number(db.products[idx].quantity || 0) + Number(delta || 0));

    db.products[idx].quantity = newQty;
    db.products[idx].lastUpdated = new Date().toISOString();
    saveData(db);
    res.json(db.products[idx]);
});

// Client-side HTML Fallbacks
app.get('/login', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'login.html')));
app.get('*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 StockPulse NextGen running on port ${PORT}`);
});
