"""
StockPulse NextGen - Python Flask REST Backend & Static Server
Production ready for Render, Railway, Heroku, Fly.io or Local Execution
"""

import os
import sqlite3
import hashlib
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

APP_DIR = os.path.dirname(os.path.abspath(__file__))
# Check public dir first, fallback to APP_DIR for root deployment
PUBLIC_DIR = os.path.join(APP_DIR, 'public') if os.path.exists(os.path.join(APP_DIR, 'public', 'index.html')) else APP_DIR
DB_PATH = os.path.join(APP_DIR, 'stockpulse.db')

app = Flask(__name__, static_folder=PUBLIC_DIR)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'stockpulse-earthy-nextgen-secret-2026')

# Security Headers Middleware
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# Database Initialization
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Products Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL,
                cost REAL DEFAULT 0,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                threshold INTEGER NOT NULL,
                image TEXT,
                last_updated TEXT NOT NULL
            )
        ''')

        # Audit Logs Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                date TEXT NOT NULL,
                product_name TEXT NOT NULL,
                type TEXT NOT NULL,
                detail TEXT NOT NULL
            )
        ''')

        # Seed Default Users if none exist
        cursor.execute('SELECT COUNT(*) FROM users')
        if cursor.fetchone()[0] == 0:
            demo_users = [
                ('usr-admin', 'Warehouse Administrator', 'admin@stockpulse.io', hash_password('demo1234'), 'Warehouse Admin'),
                ('usr-mgr', 'Elena Rodriguez', 'manager@stockpulse.io', hash_password('demo1234'), 'Warehouse Manager'),
                ('usr-spec', 'Marcus Vance', 'specialist@stockpulse.io', hash_password('demo1234'), 'Inventory Specialist')
            ]
            for uid, name, email, phash, role in demo_users:
                cursor.execute(
                    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                    (uid, name, email, phash, role, datetime.now().isoformat())
                )

        # Seed Default Products if none exist
        cursor.execute('SELECT COUNT(*) FROM products')
        if cursor.fetchone()[0] == 0:
            seed_items = [
                ('prod-101', 'Keychron Q3 Pro Wireless Mechanical Keyboard', 'TECH-8821', 'Electronics', 130.00, 219.00, 14, 5, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80'),
                ('prod-102', 'Herman Miller Style Ergonomic Lumbar Mesh Chair', 'OFF-4029', 'Office Supplies', 160.00, 289.50, 4, 6, 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=400&auto=format&fit=crop&q=80'),
                ('prod-103', 'Double-Walled Insulated Thermal Tumbler 1.2L', 'HDW-1092', 'Hardware', 12.00, 34.99, 0, 10, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80'),
                ('prod-104', 'Single Origin Ethiopian Heirloom Coffee Beans 1kg', 'GRO-5541', 'Grocery', 11.50, 24.50, 42, 12, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80'),
                ('prod-105', 'Apex Precision OLED Smart Health Tracker Gen 5', 'TECH-9910', 'Electronics', 95.00, 179.00, 3, 6, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'),
                ('prod-106', 'Artisan Washed Organic Cotton Overshirt', 'APP-3320', 'Apparel', 32.00, 88.00, 22, 8, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80'),
                ('prod-107', 'Matte Ceramic Pour-Over Dripper & Server Set', 'GRO-7712', 'Grocery', 18.00, 45.00, 9, 5, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80')
            ]
            for pid, name, sku, cat, cost, price, qty, thresh, img in seed_items:
                cursor.execute(
                    'INSERT INTO products (id, name, sku, category, cost, price, quantity, threshold, image, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (pid, name, sku, cat, cost, price, qty, thresh, img, datetime.now().isoformat())
                )

        conn.commit()

def hash_password(password: str) -> str:
    return hashlib.sha256((password + 'stockpulse_salt_2026').encode('utf-8')).hexdigest()

# Static Frontend Routes
@app.route('/')
def serve_index():
    return send_from_directory(PUBLIC_DIR, 'index.html')

@app.route('/login')
@app.route('/login.html')
def serve_login():
    return send_from_directory(PUBLIC_DIR, 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(PUBLIC_DIR, path)

# REST API Endpoints
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'app': 'StockPulse NextGen',
        'engine': 'Python Flask',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400

    hashed = hash_password(password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, email, role FROM users WHERE LOWER(email) = ? AND password_hash = ?', (email, hashed))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401

        user_dict = dict(user)
        token = f"token_{user_dict['id']}_{int(datetime.now().timestamp())}"
        return jsonify({'user': user_dict, 'token': token})

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'Inventory Specialist')

    if not name or not email or not password:
        return jsonify({'message': 'All fields are required'}), 400

    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters long'}), 400

    user_id = f"usr_{int(datetime.now().timestamp() * 1000)}"
    hashed = hash_password(password)

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                (user_id, name, email, hashed, role, datetime.now().isoformat())
            )
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'message': 'An account with this email already exists'}), 409

    user_dict = {'id': user_id, 'name': name, 'email': email, 'role': role}
    token = f"token_{user_id}_{int(datetime.now().timestamp())}"
    return jsonify({'user': user_dict, 'token': token}), 201

@app.route('/api/products', methods=['GET'])
def get_products():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products ORDER BY name ASC')
        rows = cursor.fetchall()
        return jsonify([dict(r) for r in rows])

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.get_json() or {}
    prod_id = f"prod_{int(datetime.now().timestamp() * 1000)}"
    name = data.get('name', '').strip()
    sku = data.get('sku', '').strip().upper()
    category = data.get('category', 'Electronics')
    cost = float(data.get('cost', 0))
    price = float(data.get('price', 0))
    quantity = int(data.get('quantity', 0))
    threshold = int(data.get('threshold', 5))
    image = data.get('image', '').strip()
    now_iso = datetime.now().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''INSERT INTO products (id, name, sku, category, cost, price, quantity, threshold, image, last_updated)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (prod_id, name, sku, category, cost, price, quantity, threshold, image, now_iso)
        )
        conn.commit()

    return jsonify({
        'id': prod_id, 'name': name, 'sku': sku, 'category': category,
        'cost': cost, 'price': price, 'quantity': quantity,
        'threshold': threshold, 'image': image, 'last_updated': now_iso
    }), 201

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.get_json() or {}
    now_iso = datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''UPDATE products 
               SET name = ?, sku = ?, category = ?, cost = ?, price = ?, quantity = ?, threshold = ?, image = ?, last_updated = ?
               WHERE id = ?''',
            (data.get('name'), data.get('sku'), data.get('category'), float(data.get('cost', 0)),
             float(data.get('price', 0)), int(data.get('quantity', 0)), int(data.get('threshold', 5)),
             data.get('image'), now_iso, product_id)
        )
        conn.commit()

    return jsonify({**data, 'id': product_id, 'last_updated': now_iso})

@app.route('/api/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
    return jsonify({'success': True, 'id': product_id})

@app.route('/api/products/<product_id>/adjust', methods=['POST'])
def adjust_product_stock(product_id):
    data = request.get_json() or {}
    delta = int(data.get('delta', 0))
    exact = data.get('exact')
    now_iso = datetime.now().isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT quantity FROM products WHERE id = ?', (product_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'message': 'Product not found'}), 404

        current_qty = row['quantity']
        if exact is not None:
            new_qty = max(0, int(exact))
        else:
            new_qty = max(0, current_qty + delta)

        cursor.execute('UPDATE products SET quantity = ?, last_updated = ? WHERE id = ?', (new_qty, now_iso, product_id))
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        updated = cursor.fetchone()
        conn.commit()

        return jsonify(dict(updated))

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 StockPulse NextGen running at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
