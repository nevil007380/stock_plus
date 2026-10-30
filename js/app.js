/**
 * StockPulse NextGen - Advanced Inventory Controller & Workstation Engine
 * Featuring Multi-Select Batch Actions, Confetti Micro-Animations, and Stock Health Bars
 */

const SEED_PRODUCTS = [
    {
        id: 'prod-101',
        name: 'Keychron Q3 Pro Wireless Mechanical Keyboard',
        sku: 'TECH-8821',
        category: 'Electronics',
        cost: 130.00,
        price: 219.00,
        quantity: 14,
        threshold: 5,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-102',
        name: 'Herman Miller Style Ergonomic Lumbar Mesh Chair',
        sku: 'OFF-4029',
        category: 'Office Supplies',
        cost: 160.00,
        price: 289.50,
        quantity: 4,
        threshold: 6,
        image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1270?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-103',
        name: 'Double-Walled Insulated Thermal Tumbler 1.2L',
        sku: 'HDW-1092',
        category: 'Hardware',
        cost: 12.00,
        price: 34.99,
        quantity: 0,
        threshold: 10,
        image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-104',
        name: 'Single Origin Ethiopian Heirloom Coffee Beans 1kg',
        sku: 'GRO-5541',
        category: 'Grocery',
        cost: 11.50,
        price: 24.50,
        quantity: 42,
        threshold: 12,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-105',
        name: 'Apex Precision OLED Smart Health Tracker Gen 5',
        sku: 'TECH-9910',
        category: 'Electronics',
        cost: 95.00,
        price: 179.00,
        quantity: 3,
        threshold: 6,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-106',
        name: 'Artisan Washed Organic Cotton Overshirt',
        sku: 'APP-3320',
        category: 'Apparel',
        cost: 32.00,
        price: 88.00,
        quantity: 22,
        threshold: 8,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'prod-107',
        name: 'Matte Ceramic Pour-Over Dripper & Server Set',
        sku: 'GRO-7712',
        category: 'Grocery',
        cost: 18.00,
        price: 45.00,
        quantity: 9,
        threshold: 5,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
        lastUpdated: new Date().toISOString()
    }
];

const CATEGORIES = ['All', 'Electronics', 'Apparel', 'Grocery', 'Hardware', 'Office Supplies', 'Health & Beauty'];
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=80';

// Global state
let products = [];
let auditLogs = [];
let activeCategory = 'All';
let activeStatus = 'ALL';
let sortMode = 'name_asc';
let searchQuery = '';
let viewMode = 'grid';
let quickUrgentOnly = false;
let activeAdjustProductId = null;
let activeBarcodeProduct = null;
let selectedProductIds = new Set();

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    AuthManager.init();
    await ApiService.init();
    await loadInitialData();
    setupSearchListeners();
    setupKeyboardShortcuts();
    renderApp();
    renderCategoryTabs();
    safeLucide();
});

function safeLucide() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('stockpulse_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('stockpulse_theme', next);
    updateThemeIcon(next);
    showToast(`Switched to ${next === 'dark' ? 'Earthy Dark' : 'Earthy Warm Light'} theme`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
        icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        safeLucide();
    }
}

async function loadInitialData() {
    try {
        const loaded = await ApiService.getProducts();
        if (loaded && loaded.length > 0) {
            products = loaded;
        } else {
            products = [...SEED_PRODUCTS];
            localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
        }

        const savedLogs = localStorage.getItem('stockpulse_audit_logs');
        if (savedLogs) {
            auditLogs = JSON.parse(savedLogs);
        } else {
            auditLogs = [{
                id: 'log-' + Date.now(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                productName: 'System Security Core',
                type: 'SYSTEM',
                detail: 'StockPulse NextGen database mounted.'
            }];
            saveAuditLogs();
        }

        const savedView = localStorage.getItem('stockpulse_view_mode');
        if (savedView) viewMode = savedView;

    } catch (e) {
        console.warn('Fallback to seed data:', e);
        products = [...SEED_PRODUCTS];
    }
}

function saveAuditLogs() {
    localStorage.setItem('stockpulse_audit_logs', JSON.stringify(auditLogs.slice(0, 100)));
}

function logAuditEvent(productName, type, detail) {
    const logEntry = {
        id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        productName: SecurityUtil.escapeHTML(productName),
        type,
        detail: SecurityUtil.escapeHTML(detail)
    };
    auditLogs.unshift(logEntry);
    saveAuditLogs();
}

function setupSearchListeners() {
    const globalSearch = document.getElementById('global-search');
    const mobileSearch = document.getElementById('mobile-global-search');
    const clearBtn = document.getElementById('clear-search-btn');

    const handleSearchInput = (e) => {
        searchQuery = (e.target.value || '').toLowerCase().trim();
        if (globalSearch && globalSearch !== e.target) globalSearch.value = e.target.value;
        if (mobileSearch && mobileSearch !== e.target) mobileSearch.value = e.target.value;

        if (clearBtn) {
            if (searchQuery.length > 0) clearBtn.classList.remove('hidden');
            else clearBtn.classList.add('hidden');
        }
        renderApp();
    };

    if (globalSearch) globalSearch.addEventListener('input', handleSearchInput);
    if (mobileSearch) mobileSearch.addEventListener('input', handleSearchInput);

    window.addEventListener('click', (e) => {
        const dropdown = document.getElementById('export-dropdown');
        if (dropdown && !dropdown.contains(e.target) && !e.target.closest('button[onclick="toggleExportMenu()"]')) {
            dropdown.classList.add('hidden');
        }
        const profileDropdown = document.getElementById('profile-dropdown');
        if (profileDropdown && !profileDropdown.contains(e.target) && !e.target.closest('button[onclick="toggleProfileMenu()"]')) {
            profileDropdown.classList.add('hidden');
        }
    });
}

function clearSearch() {
    searchQuery = '';
    const gs = document.getElementById('global-search');
    const ms = document.getElementById('mobile-global-search');
    if (gs) gs.value = '';
    if (ms) ms.value = '';
    document.getElementById('clear-search-btn').classList.add('hidden');
    renderApp();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        if ((e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') || 
            (e.ctrlKey && e.key.toLowerCase() === 'k')) {
            e.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) searchInput.focus();
        }

        if (e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openAddProductModal();
        }

        if (e.key === 'Escape') {
            closeProductModal();
            closeAdjustModal();
            closeBarcodeModal();
            closeAuditModal();
            const ed = document.getElementById('export-dropdown');
            if (ed) ed.classList.add('hidden');
            const pd = document.getElementById('profile-dropdown');
            if (pd) pd.classList.add('hidden');
        }
    });
}

function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => {
        const count = cat === 'All' 
            ? products.length 
            : products.filter(p => p.category === cat).length;
        
        const isActive = activeCategory === cat;

        return `
            <button onclick="setCategory('${cat}')" 
                class="px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isActive ? 'shadow-sm' : 'hover:opacity-90'
                }"
                style="${
                    isActive 
                        ? 'background-color: var(--tea-green); color: var(--bronze-deepest); border-color: var(--light-bronze);' 
                        : 'background-color: var(--card-surface-soft); color: var(--text-muted); border-color: var(--border-subtle);'
                }">
                <span>${cat}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/60 text-slate-900 font-bold' : 'opacity-70'
                }">${count}</span>
            </button>
        `;
    }).join('');
}

function setCategory(cat) {
    activeCategory = cat;
    renderCategoryTabs();
    renderApp();
}

function setViewMode(mode) {
    viewMode = mode;
    localStorage.setItem('stockpulse_view_mode', mode);
    updateViewModeButtons();
    renderProductFeed();
    safeLucide();
}

function updateViewModeButtons() {
    const gridBtn = document.getElementById('view-mode-grid');
    const tableBtn = document.getElementById('view-mode-table');
    if (!gridBtn || !tableBtn) return;

    if (viewMode === 'grid') {
        gridBtn.style.backgroundColor = 'var(--tea-green)';
        gridBtn.style.color = 'var(--bronze-deepest)';
        tableBtn.style.backgroundColor = 'transparent';
        tableBtn.style.color = 'var(--text-muted)';
    } else {
        tableBtn.style.backgroundColor = 'var(--tea-green)';
        tableBtn.style.color = 'var(--bronze-deepest)';
        gridBtn.style.backgroundColor = 'transparent';
        gridBtn.style.color = 'var(--text-muted)';
    }
}

function handleStatusChange(e) {
    activeStatus = e.target.value;
    renderApp();
}

function handleSortChange(e) {
    sortMode = e.target.value;
    renderApp();
}

function filterByStatus(status) {
    activeStatus = status;
    const select = document.getElementById('status-filter');
    if (select) select.value = status;
    renderApp();
}

function toggleQuickLowStock() {
    quickUrgentOnly = !quickUrgentOnly;
    const btn = document.getElementById('quick-alert-btn');
    if (btn) {
        if (quickUrgentOnly) {
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-outline');
        } else {
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-outline');
        }
    }
    renderApp();
}

function renderApp() {
    renderMetrics();
    renderBatchToolbar();
    renderProductFeed();
    updateViewModeButtons();
    safeLucide();
}

function renderMetrics() {
    const totalSKUs = products.length;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;
    let totalPotentialProfit = 0;

    products.forEach(p => {
        const qty = Number(p.quantity) || 0;
        const thresh = Number(p.threshold) || 0;
        const price = Number(p.price) || 0;
        const cost = Number(p.cost) || (price * 0.6);

        totalUnits += qty;
        if (qty === 0) {
            outOfStockCount++;
        } else if (qty <= thresh) {
            lowStockCount++;
        }

        totalValuation += (qty * price);
        totalPotentialProfit += (qty * (price - cost));
    });

    const elTotal = document.getElementById('stat-total-skus');
    const elUnits = document.getElementById('stat-total-units');
    const elLow = document.getElementById('stat-low-stock');
    const elOut = document.getElementById('stat-out-stock');
    const elVal = document.getElementById('stat-total-value');
    const elProf = document.getElementById('stat-profit-potential');

    if (elTotal) elTotal.innerText = totalSKUs;
    if (elUnits) elUnits.innerText = totalUnits.toLocaleString();
    if (elLow) elLow.innerText = lowStockCount;
    if (elOut) elOut.innerText = outOfStockCount;
    if (elVal) elVal.innerText = '$' + totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (elProf) elProf.innerText = '$' + Math.max(0, Math.round(totalPotentialProfit)).toLocaleString();
}

function getFilteredAndSortedProducts() {
    return products.filter(p => {
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        const qty = Number(p.quantity) || 0;
        const thresh = Number(p.threshold) || 0;
        
        let matchStatus = true;
        if (activeStatus === 'IN_STOCK') matchStatus = qty > thresh;
        if (activeStatus === 'LOW_STOCK') matchStatus = qty > 0 && qty <= thresh;
        if (activeStatus === 'OUT_OF_STOCK') matchStatus = qty === 0;

        if (quickUrgentOnly && qty > thresh) return false;

        const query = searchQuery;
        const matchSearch = !query || 
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.sku && p.sku.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query));

        return matchCat && matchStatus && matchSearch;
    }).sort((a, b) => {
        switch(sortMode) {
            case 'name_asc': return (a.name || '').localeCompare(b.name || '');
            case 'name_desc': return (b.name || '').localeCompare(a.name || '');
            case 'qty_asc': return (a.quantity || 0) - (b.quantity || 0);
            case 'qty_desc': return (b.quantity || 0) - (a.quantity || 0);
            case 'price_asc': return (a.price || 0) - (b.price || 0);
            case 'price_desc': return (b.price || 0) - (a.price || 0);
            case 'value_desc': return ((b.quantity || 0) * (b.price || 0)) - ((a.quantity || 0) * (a.price || 0));
            default: return 0;
        }
    });
}

// Multi-select batch actions toolbar
function renderBatchToolbar() {
    let toolbar = document.getElementById('batch-actions-bar');
    if (!toolbar) return;

    if (selectedProductIds.size > 0) {
        toolbar.classList.remove('hidden');
        document.getElementById('batch-selected-count').innerText = `${selectedProductIds.size} item(s) selected`;
    } else {
        toolbar.classList.add('hidden');
    }
}

function toggleSelectProduct(id) {
    if (selectedProductIds.has(id)) {
        selectedProductIds.delete(id);
    } else {
        selectedProductIds.add(id);
    }
    renderApp();
}

function selectAllFiltered() {
    const filtered = getFilteredAndSortedProducts();
    if (selectedProductIds.size === filtered.length) {
        selectedProductIds.clear();
    } else {
        filtered.forEach(p => selectedProductIds.add(p.id));
    }
    renderApp();
}

function clearSelection() {
    selectedProductIds.clear();
    renderApp();
}

async function batchRestockSelected() {
    if (selectedProductIds.size === 0) return;
    let count = 0;
    for (const id of selectedProductIds) {
        const p = products.find(prod => prod.id === id);
        if (p) {
            p.quantity = (Number(p.quantity) || 0) + 10;
            p.lastUpdated = new Date().toISOString();
            await ApiService.saveProduct(p);
            count++;
        }
    }
    triggerConfetti();
    logAuditEvent('Batch Restock', 'RESTOCK', `Restocked +10 units to ${count} selected item(s).`);
    selectedProductIds.clear();
    renderApp();
    showToast(`Successfully restocked +10 units to ${count} products!`, 'success');
}

async function batchDeleteSelected() {
    if (selectedProductIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedProductIds.size} selected item(s)?`)) {
        for (const id of selectedProductIds) {
            await ApiService.deleteProduct(id);
            products = products.filter(p => p.id !== id);
        }
        logAuditEvent('Batch Delete', 'DELETE', `Deleted ${selectedProductIds.size} items.`);
        selectedProductIds.clear();
        renderCategoryTabs();
        renderApp();
        showToast('Selected items removed from catalog', 'warning');
    }
}

function renderProductFeed() {
    const container = document.getElementById('product-feed-container');
    const badge = document.getElementById('product-count-badge');
    const filtered = getFilteredAndSortedProducts();

    if (badge) badge.innerText = `Showing ${filtered.length} of ${products.length} items`;

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="glass-panel p-12 text-center space-y-3 animate-fade-in">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style="background-color: var(--cornsilk); color: var(--light-bronze);">
                    <i data-lucide="package-search" class="w-7 h-7"></i>
                </div>
                <h3 class="font-bold text-base" style="color: var(--text-heading);">No matching products found</h3>
                <p class="text-xs max-w-sm mx-auto" style="color: var(--text-muted);">
                    Try clearing search criteria or add a new item into this category.
                </p>
                <div class="pt-2">
                    <button onclick="clearSearch(); setCategory('All'); filterByStatus('ALL')" class="btn btn-secondary py-1.5 px-4 text-xs">
                        Reset Filters
                    </button>
                </div>
            </div>
        `;
        return;
    }

    if (viewMode === 'table') {
        renderTableView(filtered, container);
    } else {
        renderGridView(filtered, container);
    }
}

// Table View with Stock Level Health Indicator
function renderTableView(list, container) {
    const allSelected = list.length > 0 && list.every(p => selectedProductIds.has(p.id));

    container.innerHTML = `
        <div class="glass-panel overflow-hidden border animate-fade-in">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="border-b" style="background-color: var(--cornsilk); border-color: var(--border-subtle); color: var(--text-heading);">
                        <tr>
                            <th class="py-3 px-3 w-8">
                                <input type="checkbox" onchange="selectAllFiltered()" ${allSelected ? 'checked' : ''} class="rounded border-slate-300 cursor-pointer">
                            </th>
                            <th class="py-3 px-3 font-bold">Item & SKU</th>
                            <th class="py-3 px-3 font-bold">Category</th>
                            <th class="py-3 px-3 font-bold">Price / Unit</th>
                            <th class="py-3 px-3 font-bold">On Hand Stock</th>
                            <th class="py-3 px-3 font-bold">Status & Health</th>
                            <th class="py-3 px-3 font-bold text-right">Inventory Value</th>
                            <th class="py-3 px-4 font-bold text-right">Quick Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y" style="border-color: var(--border-subtle);">
                        ${list.map((p, idx) => {
                            const qty = Number(p.quantity) || 0;
                            const thresh = Number(p.threshold) || 1;
                            const price = Number(p.price) || 0;
                            const totalVal = (qty * price).toFixed(2);
                            const badge = getStatusBadgeHTML(qty, thresh);
                            const isSelected = selectedProductIds.has(p.id);

                            // Calculate Health Percent
                            const healthPercent = Math.min(100, Math.round((qty / (thresh * 2)) * 100));
                            const healthClass = qty === 0 ? 'stock-level-critical' : (qty <= thresh ? 'stock-level-warning' : 'stock-level-healthy');

                            return `
                                <tr class="hover:bg-beige/40 transition ${isSelected ? 'bg-beige/30' : ''}">
                                    <td class="py-3 px-3">
                                        <input type="checkbox" onchange="toggleSelectProduct('${p.id}')" ${isSelected ? 'checked' : ''} class="rounded border-slate-300 cursor-pointer">
                                    </td>
                                    <td class="py-3 px-3">
                                        <div class="flex items-center gap-3">
                                            <img src="${p.image || FALLBACK_IMAGE}" onerror="this.src='${FALLBACK_IMAGE}'" 
                                                 class="w-10 h-10 rounded-lg object-cover border flex-shrink-0" style="border-color: var(--border-strong);" alt="">
                                            <div class="min-w-0">
                                                <div class="font-bold truncate max-w-xs" style="color: var(--text-heading);">${SecurityUtil.escapeHTML(p.name)}</div>
                                                <span class="font-mono text-[11px] px-1.5 py-0.5 rounded border" style="background-color: var(--card-surface-soft); border-color: var(--border-subtle); color: var(--bronze-darker);">
                                                    ${SecurityUtil.escapeHTML(p.sku)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-3 font-semibold" style="color: var(--text-muted);">${SecurityUtil.escapeHTML(p.category)}</td>
                                    <td class="py-3 px-3 font-bold" style="color: var(--text-heading);">$${price.toFixed(2)}</td>
                                    <td class="py-3 px-3">
                                        <div class="flex items-center gap-2">
                                            <span class="font-mono font-extrabold text-sm ${qty === 0 ? 'text-rose-600' : ''}">${qty}</span>
                                            <div class="flex items-center gap-1">
                                                <button onclick="inlineAdjust('${p.id}', -1)" class="w-6 h-6 rounded flex items-center justify-center font-bold border hover:bg-beige text-xs" title="Decrease 1">-</button>
                                                <button onclick="inlineAdjust('${p.id}', 1)" class="w-6 h-6 rounded flex items-center justify-center font-bold border hover:bg-beige text-xs" title="Increase 1">+</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-3">
                                        <div class="space-y-1">
                                            <div>${badge}</div>
                                            <div class="stock-level-bar" title="Health Buffer: ${healthPercent}%">
                                                <div class="stock-level-fill ${healthClass}" style="width: ${healthPercent}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-3 px-3 text-right font-mono font-bold" style="color: var(--bronze-darker);">$${Number(totalVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td class="py-3 px-4 text-right">
                                        <div class="inline-flex items-center gap-1">
                                            <button onclick="openAdjustModal('${p.id}')" title="Adjust Stock Count" class="btn btn-outline btn-icon p-1.5">
                                                <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                                            </button>
                                            <button onclick="openBarcodeModal('${p.id}')" title="Generate Shelf Tag" class="btn btn-outline btn-icon p-1.5">
                                                <i data-lucide="barcode" class="w-3.5 h-3.5"></i>
                                            </button>
                                            <button onclick="openEditProductModal('${p.id}')" title="Edit Product Details" class="btn btn-outline btn-icon p-1.5">
                                                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                            </button>
                                            <button onclick="deleteProduct('${p.id}')" title="Delete Product" class="btn btn-danger-outline btn-icon p-1.5">
                                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Card Grid View with Modern Curved Showcase Design & Full Mobile Responsiveness
function renderGridView(list, container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            ${list.map((p, idx) => {
                const qty = Number(p.quantity) || 0;
                const thresh = Number(p.threshold) || 1;
                const price = Number(p.price) || 0;
                const cost = Number(p.cost) || (price * 0.6);
                const totalVal = (qty * price).toFixed(2);
                const marginPercent = price > 0 ? (((price - cost) / price) * 100).toFixed(0) : '0';
                const badge = getStatusBadgeHTML(qty, thresh);
                const isSelected = selectedProductIds.has(p.id);

                const healthPercent = Math.min(100, Math.round((qty / (thresh * 2)) * 100));
                const healthClass = qty === 0 ? 'stock-level-critical' : (qty <= thresh ? 'stock-level-warning' : 'stock-level-healthy');

                return `
                    <div class="product-showcase-card animate-cascade ${isSelected ? 'ring-2 ring-lightBronze' : ''}" 
                         style="animation-delay: ${Math.min(idx * 30, 240)}ms;">
                        
                        <!-- Top Visual Media Banner -->
                        <div class="product-media-wrap">
                            <span class="card-floating-badge">${badge}</span>
                            
                            <input type="checkbox" onchange="toggleSelectProduct('${p.id}')" ${isSelected ? 'checked' : ''} 
                                   class="card-select-checkbox shadow-md" title="Select product">

                            <img src="${p.image || FALLBACK_IMAGE}" onerror="this.src='${FALLBACK_IMAGE}'" 
                                 class="product-media-img" alt="${SecurityUtil.escapeHTML(p.name)}">

                            ${qty === 0 ? '<div class="absolute inset-0 bg-rose-950/70 backdrop-blur-[2px] flex items-center justify-center font-black text-white text-xs uppercase tracking-widest">Out of Stock</div>' : ''}
                        </div>

                        <!-- Card Details Body -->
                        <div class="product-card-body">
                            
                            <!-- Header: SKU & Category -->
                            <div>
                                <div class="flex items-center justify-between gap-1 mb-1.5">
                                    <span class="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border" 
                                          style="background-color: var(--cornsilk); border-color: var(--border-subtle); color: var(--bronze-darker);">
                                        ${SecurityUtil.escapeHTML(p.sku)}
                                    </span>
                                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" 
                                          style="background-color: var(--card-surface-soft); color: var(--text-muted);">
                                        ${SecurityUtil.escapeHTML(p.category)}
                                    </span>
                                </div>

                                <h3 class="font-extrabold text-sm leading-snug line-clamp-2" style="color: var(--text-heading);" title="${SecurityUtil.escapeHTML(p.name)}">
                                    ${SecurityUtil.escapeHTML(p.name)}
                                </h3>
                            </div>

                            <!-- Pricing & Key Metrics Pill Grid -->
                            <div class="grid grid-cols-3 gap-1.5 p-2 rounded-xl border text-center" 
                                 style="background-color: var(--card-surface-soft); border-color: var(--border-subtle);">
                                <div>
                                    <span class="text-[9px] font-bold uppercase tracking-wider block" style="color: var(--text-muted);">Unit Price</span>
                                    <span class="font-extrabold text-xs" style="color: var(--text-heading);">$${price.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span class="text-[9px] font-bold uppercase tracking-wider block" style="color: var(--text-muted);">In Stock</span>
                                    <span class="font-black font-mono text-xs ${qty === 0 ? 'text-rose-600' : ''}" style="color: ${qty > thresh ? 'var(--text-heading)' : 'var(--badge-low-stock-text)'};">
                                        ${qty}
                                    </span>
                                </div>
                                <div>
                                    <span class="text-[9px] font-bold uppercase tracking-wider block" style="color: var(--text-muted);">Margin</span>
                                    <span class="font-bold text-xs" style="color: var(--badge-in-stock-text);">${marginPercent}%</span>
                                </div>
                            </div>

                            <!-- Stock Health Buffer Bar -->
                            <div class="space-y-1">
                                <div class="flex justify-between items-center text-[10px] text-muted">
                                    <span class="font-semibold">Stock Buffer</span>
                                    <span class="font-mono text-[9px]">${qty} units / min ${thresh}</span>
                                </div>
                                <div class="stock-level-bar">
                                    <div class="stock-level-fill ${healthClass}" style="width: ${healthPercent}%"></div>
                                </div>
                            </div>

                            <!-- Total Valuation Footer -->
                            <div class="flex items-center justify-between text-xs pt-1 border-t" style="border-color: var(--border-subtle);">
                                <span class="text-[10px] font-semibold text-muted">Catalog Value</span>
                                <span class="font-mono font-bold text-xs" style="color: var(--bronze-darker);">$${Number(totalVal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <!-- Action Buttons Bar -->
                            <div class="flex items-center justify-between pt-1 gap-1.5">
                                <div class="flex items-center gap-1">
                                    <button onclick="inlineAdjust('${p.id}', -1)" class="btn btn-outline py-1 px-2 text-xs font-bold" title="Decrease Stock by 1">-1</button>
                                    <button onclick="inlineAdjust('${p.id}', 1)" class="btn btn-outline py-1 px-2 text-xs font-bold" title="Increase Stock by 1">+1</button>
                                    <button onclick="openAdjustModal('${p.id}')" class="btn btn-outline py-1 px-2 text-xs" title="Adjust Stock">
                                        <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>

                                <div class="flex items-center gap-1">
                                    <button onclick="openBarcodeModal('${p.id}')" title="Print Shelf Tag" class="btn btn-outline btn-icon p-1.5">
                                        <i data-lucide="barcode" class="w-3.5 h-3.5"></i>
                                    </button>
                                    <button onclick="openEditProductModal('${p.id}')" title="Edit Product" class="btn btn-outline btn-icon p-1.5">
                                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                                    </button>
                                    <button onclick="deleteProduct('${p.id}')" title="Remove Product" class="btn btn-danger-outline btn-icon p-1.5">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>
                            </div>

                        </div>

                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getStatusBadgeHTML(qty, thresh) {
    if (qty === 0) {
        return `<span class="status-badge out-stock"><i data-lucide="x-circle" class="w-3 h-3"></i> Out of Stock</span>`;
    } else if (qty <= thresh) {
        return `<span class="status-badge low-stock pulse-subtle"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Low Stock (${qty})</span>`;
    } else {
        return `<span class="status-badge in-stock"><span class="live-dot mr-1"></span> In Stock</span>`;
    }
}

async function inlineAdjust(productId, delta) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    const oldQty = Number(p.quantity) || 0;
    try {
        const updated = await ApiService.adjustStock(productId, delta, null, 'Quick Inline Step');
        const idx = products.findIndex(prod => prod.id === productId);
        if (idx !== -1) products[idx] = updated;

        logAuditEvent(p.name, delta > 0 ? 'STOCK_IN' : 'STOCK_OUT', `Inline step ${delta > 0 ? '+' : ''}${delta} (${oldQty} → ${updated.quantity})`);
        renderApp();
        showToast(`${p.sku}: Stock ${delta > 0 ? '+' : ''}${delta} (Now ${updated.quantity})`, 'info');
    } catch (e) {
        showToast('Failed to adjust stock: ' + e.message, 'warning');
    }
}

async function restockAllCritical() {
    let count = 0;
    for (const p of products) {
        const qty = Number(p.quantity) || 0;
        const thresh = Number(p.threshold) || 5;
        if (qty <= thresh) {
            p.quantity = thresh + 10;
            p.lastUpdated = new Date().toISOString();
            await ApiService.saveProduct(p);
            count++;
        }
    }

    if (count > 0) {
        triggerConfetti();
        logAuditEvent('Batch Restock', 'RESTOCK', `Auto-restocked ${count} critical item(s) to safe buffer.`);
        renderApp();
        showToast(`Restocked ${count} critical products to safe threshold!`, 'success');
    } else {
        showToast('All products are currently well stocked!', 'info');
    }
}

function generateAutoSKU() {
    const prefix = (activeCategory && activeCategory !== 'All') ? activeCategory.substring(0, 3).toUpperCase() : 'SKU';
    const random = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('modal-field-sku').value = `${prefix}-${random}`;
}

function openAddProductModal() {
    document.getElementById('product-modal-title').innerText = 'Add New Product';
    document.getElementById('modal-submit-text').innerText = 'Save Product';
    document.getElementById('modal-field-id').value = '';
    document.getElementById('product-modal-form').reset();
    
    generateAutoSKU();
    if (activeCategory && activeCategory !== 'All') {
        document.getElementById('modal-field-category').value = activeCategory;
    }

    calculateMarginPreview();
    updateModalImagePreview();

    document.getElementById('product-modal').classList.remove('hidden');
    document.getElementById('modal-field-name').focus();
    safeLucide();
}

function openEditProductModal(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('product-modal-title').innerText = 'Edit Product Details';
    document.getElementById('modal-submit-text').innerText = 'Update Product';
    document.getElementById('modal-field-id').value = p.id;

    document.getElementById('modal-field-name').value = p.name;
    document.getElementById('modal-field-sku').value = p.sku;
    document.getElementById('modal-field-category').value = p.category;
    document.getElementById('modal-field-cost').value = p.cost || '';
    document.getElementById('modal-field-price').value = p.price;
    document.getElementById('modal-field-quantity').value = p.quantity;
    document.getElementById('modal-field-threshold').value = p.threshold;
    document.getElementById('modal-field-image').value = p.image || '';

    calculateMarginPreview();
    updateModalImagePreview();

    document.getElementById('product-modal').classList.remove('hidden');
    safeLucide();
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function calculateMarginPreview() {
    const costVal = parseFloat(document.getElementById('modal-field-cost').value) || 0;
    const priceVal = parseFloat(document.getElementById('modal-field-price').value) || 0;
    const badge = document.getElementById('margin-percentage-badge');

    if (priceVal > 0) {
        const profit = priceVal - costVal;
        const marginPercent = ((profit / priceVal) * 100).toFixed(1);
        badge.innerText = `${marginPercent}% ($${profit.toFixed(2)} / unit)`;
        badge.style.color = profit >= 0 ? 'var(--badge-in-stock-text)' : 'var(--badge-out-stock-text)';
    } else {
        badge.innerText = `0.0% ($0.00 / unit)`;
    }
}

function updateModalImagePreview() {
    const url = document.getElementById('modal-field-image').value.trim();
    const img = document.getElementById('modal-preview-img');
    const placeholder = document.getElementById('modal-preview-placeholder');

    if (url) {
        img.src = url;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        img.src = '';
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }
}

function handleModalImageError() {
    const img = document.getElementById('modal-preview-img');
    const placeholder = document.getElementById('modal-preview-placeholder');
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
}

async function handleProductModalSubmit(e) {
    e.preventDefault();

    const editId = document.getElementById('modal-field-id').value;
    const name = document.getElementById('modal-field-name').value.trim();
    const sku = document.getElementById('modal-field-sku').value.trim();
    const category = document.getElementById('modal-field-category').value;
    const cost = parseFloat(document.getElementById('modal-field-cost').value) || 0;
    const price = parseFloat(document.getElementById('modal-field-price').value);
    const quantity = parseInt(document.getElementById('modal-field-quantity').value, 10);
    const threshold = parseInt(document.getElementById('modal-field-threshold').value, 10);
    const image = document.getElementById('modal-field-image').value.trim();

    const payload = {
        id: editId || undefined,
        name,
        sku,
        category,
        cost,
        price,
        quantity,
        threshold,
        image
    };

    try {
        const saved = await ApiService.saveProduct(payload);
        if (editId) {
            const idx = products.findIndex(p => p.id === editId);
            if (idx !== -1) products[idx] = saved;
            logAuditEvent(name, 'PRODUCT_EDIT', `Updated SKU details (${sku})`);
            showToast(`Updated product "${name}"`, 'success');
        } else {
            products.unshift(saved);
            triggerConfetti();
            logAuditEvent(name, 'PRODUCT_CREATE', `Created SKU ${sku} (Qty: ${quantity})`);
            showToast(`Added product "${name}"`, 'success');
        }

        closeProductModal();
        renderCategoryTabs();
        renderApp();
    } catch (err) {
        showToast('Error saving product: ' + err.message, 'warning');
    }
}

async function duplicateProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    const cloned = {
        ...p,
        id: undefined,
        name: `${p.name} (Copy)`,
        sku: `${p.sku}-CPY`,
        quantity: 0
    };

    try {
        const saved = await ApiService.saveProduct(cloned);
        products.unshift(saved);
        logAuditEvent(saved.name, 'PRODUCT_DUPLICATE', `Duplicated from ${p.sku}`);
        renderCategoryTabs();
        renderApp();
        showToast(`Duplicated "${p.name}" as new draft SKU`, 'info');
    } catch (e) {
        showToast('Failed to duplicate: ' + e.message, 'warning');
    }
}

async function deleteProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    if (confirm(`Are you sure you want to delete "${p.name}" (${p.sku}) from catalog?`)) {
        try {
            await ApiService.deleteProduct(id);
            products = products.filter(prod => prod.id !== id);
            selectedProductIds.delete(id);
            logAuditEvent(p.name, 'PRODUCT_DELETE', `Deleted SKU ${p.sku}`);
            renderCategoryTabs();
            renderApp();
            showToast(`Deleted "${p.name}"`, 'warning');
        } catch (e) {
            showToast('Delete failed: ' + e.message, 'warning');
        }
    }
}

function openAdjustModal(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    activeAdjustProductId = id;
    document.getElementById('adjust-product-name').innerText = p.name;
    document.getElementById('adjust-product-sku').innerText = p.sku;
    document.getElementById('adjust-current-qty').innerText = p.quantity;
    document.getElementById('adjust-product-img').src = p.image || FALLBACK_IMAGE;
    document.getElementById('adjust-exact-input').value = '';

    document.getElementById('adjust-modal').classList.remove('hidden');
    safeLucide();
}

function closeAdjustModal() {
    activeAdjustProductId = null;
    document.getElementById('adjust-modal').classList.add('hidden');
}

async function applyAdjustStep(delta) {
    if (!activeAdjustProductId) return;
    const p = products.find(prod => prod.id === activeAdjustProductId);
    if (!p) return;

    const reason = document.getElementById('adjust-reason-select').value;
    try {
        const updated = await ApiService.adjustStock(activeAdjustProductId, delta, null, reason);
        const idx = products.findIndex(prod => prod.id === activeAdjustProductId);
        if (idx !== -1) products[idx] = updated;

        document.getElementById('adjust-current-qty').innerText = updated.quantity;
        logAuditEvent(p.name, 'ADJUST_STEP', `${delta > 0 ? '+' : ''}${delta} units (${reason})`);
        renderApp();
    } catch (e) {
        showToast('Error: ' + e.message, 'warning');
    }
}

async function applyAdjustExact() {
    if (!activeAdjustProductId) return;
    const inputVal = parseInt(document.getElementById('adjust-exact-input').value, 10);
    if (isNaN(inputVal) || inputVal < 0) {
        showToast('Please enter a valid positive quantity number', 'warning');
        return;
    }

    const p = products.find(prod => prod.id === activeAdjustProductId);
    if (!p) return;

    const reason = document.getElementById('adjust-reason-select').value;
    try {
        const updated = await ApiService.adjustStock(activeAdjustProductId, 0, inputVal, reason);
        const idx = products.findIndex(prod => prod.id === activeAdjustProductId);
        if (idx !== -1) products[idx] = updated;

        document.getElementById('adjust-current-qty').innerText = updated.quantity;
        logAuditEvent(p.name, 'SET_EXACT', `Set exact count to ${inputVal} (${reason})`);
        renderApp();
        showToast(`Inventory count updated to ${inputVal}`, 'success');
    } catch (e) {
        showToast('Error: ' + e.message, 'warning');
    }
}

function generateBarcodeSVG(text) {
    const hash = Array.from(text).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7);
    const bars = [];
    for (let i = 0; i < 48; i++) {
        const bit = (hash >> (i % 30)) & 1;
        const width = (i % 5 === 0 || i % 7 === 0) ? (bit ? 3 : 2) : 1.5;
        bars.push({ width, gap: 1.5 });
    }

    let svgContent = `<svg width="220" height="50" xmlns="http://www.w3.org/2000/svg" style="background:#fff; padding: 4px;">`;
    let currentX = 10;
    bars.forEach(bar => {
        svgContent += `<rect x="${currentX}" y="2" width="${bar.width}" height="42" fill="#111" />`;
        currentX += bar.width + bar.gap;
    });
    svgContent += `</svg>`;
    return svgContent;
}

function openBarcodeModal(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    activeBarcodeProduct = p;
    document.getElementById('tag-category').innerText = p.category;
    document.getElementById('tag-name').innerText = p.name;
    document.getElementById('tag-sku').innerText = p.sku;
    document.getElementById('tag-price').innerText = '$' + Number(p.price).toFixed(2);
    document.getElementById('tag-barcode-svg-container').innerHTML = generateBarcodeSVG(p.sku);

    document.getElementById('barcode-modal').classList.remove('hidden');
    safeLucide();
}

function closeBarcodeModal() {
    activeBarcodeProduct = null;
    document.getElementById('barcode-modal').classList.add('hidden');
}

function printShelfTag() {
    window.print();
}

function openAuditModal() {
    const container = document.getElementById('audit-log-container');
    if (auditLogs.length === 0) {
        container.innerHTML = `<p class="text-center py-8 text-muted">No audit records logged yet.</p>`;
    } else {
        container.innerHTML = auditLogs.map(log => `
            <div class="p-3 rounded-xl border flex items-center justify-between gap-3 animate-fade-in" 
                 style="background-color: var(--card-surface-soft); border-color: var(--border-subtle);">
                <div class="min-w-0">
                    <div class="font-bold text-xs" style="color: var(--text-heading);">${log.productName}</div>
                    <div class="text-[11px]" style="color: var(--text-muted);">${log.detail}</div>
                </div>
                <div class="text-right flex-shrink-0">
                    <span class="text-[10px] font-mono block" style="color: var(--text-faint);">${log.timestamp}</span>
                    <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border" style="background-color: var(--beige); color: var(--bronze-deepest); border-color: var(--tea-green);">
                        ${log.type}
                    </span>
                </div>
            </div>
        `).join('');
    }

    const ed = document.getElementById('export-dropdown');
    if (ed) ed.classList.add('hidden');
    document.getElementById('audit-modal').classList.remove('hidden');
    safeLucide();
}

function closeAuditModal() {
    document.getElementById('audit-modal').classList.add('hidden');
}

function clearAuditLog() {
    if (confirm('Clear audit movement log?')) {
        auditLogs = [];
        saveAuditLogs();
        openAuditModal();
        showToast('Audit log cleared', 'info');
    }
}

function toggleExportMenu() {
    const dropdown = document.getElementById('export-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
    safeLucide();
}

function toggleProfileMenu() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
    safeLucide();
}

// RFC 4180 Compliant CSV Export
function exportToCSV() {
    const ed = document.getElementById('export-dropdown');
    if (ed) ed.classList.add('hidden');
    
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Cost Price', 'Selling Price', 'Quantity', 'Min Threshold', 'Total Value', 'Image URL'];
    const rows = products.map(p => [
        p.id,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.sku || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.cost || 0,
        p.price || 0,
        p.quantity || 0,
        p.threshold || 0,
        ((p.quantity || 0) * (p.price || 0)).toFixed(2),
        `"${(p.image || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `StockPulse_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Inventory exported to CSV successfully', 'success');
}

function exportToJSON() {
    const ed = document.getElementById('export-dropdown');
    if (ed) ed.classList.add('hidden');

    const payload = {
        app: 'StockPulse NextGen',
        version: '3.2',
        exportedAt: new Date().toISOString(),
        products,
        auditLogs
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `StockPulse_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Full JSON Backup downloaded', 'success');
}

function handleFileImport(event) {
    const ed = document.getElementById('export-dropdown');
    if (ed) ed.classList.add('hidden');
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            if (file.name.endsWith('.json')) {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    products = parsed;
                } else if (parsed.products && Array.isArray(parsed.products)) {
                    products = parsed.products;
                    if (parsed.auditLogs) auditLogs = parsed.auditLogs;
                }
            } else if (file.name.endsWith('.csv')) {
                const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
                if (lines.length > 1) {
                    const newItems = [];
                    for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',').map(s => s.replace(/^"|"$/g, '').trim());
                        if (cols.length >= 4) {
                            newItems.push({
                                id: cols[0] || 'prod-' + Date.now() + i,
                                name: SecurityUtil.escapeHTML(cols[1] || 'Imported Product'),
                                sku: SecurityUtil.escapeHTML((cols[2] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase()),
                                category: SecurityUtil.escapeHTML(cols[3] || 'Electronics'),
                                cost: SecurityUtil.sanitizeNumber(cols[4], 0),
                                price: SecurityUtil.sanitizeNumber(cols[5], 0),
                                quantity: Math.round(SecurityUtil.sanitizeNumber(cols[6], 0)),
                                threshold: Math.round(SecurityUtil.sanitizeNumber(cols[7], 5)),
                                image: (cols[9] || '').trim(),
                                lastUpdated: new Date().toISOString()
                            });
                        }
                    }
                    if (newItems.length > 0) products = newItems;
                }
            }
            
            localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
            saveAuditLogs();
            renderCategoryTabs();
            renderApp();
            showToast(`Successfully imported ${products.length} products!`, 'success');
        } catch (err) {
            showToast('Failed to parse file: ' + err.message, 'warning');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function restoreSeedData() {
    if (confirm('Restore default sample inventory dataset?')) {
        products = JSON.parse(JSON.stringify(SEED_PRODUCTS));
        localStorage.setItem('stockpulse_products_v3', JSON.stringify(products));
        logAuditEvent('System', 'RESET_SEEDS', 'Restored demo dataset');
        renderCategoryTabs();
        renderApp();
        showToast('Sample demo inventory restored!', 'info');
    }
}

// Micro-Animation: Confetti Particle Burst
function triggerConfetti() {
    const colors = ['#ccd5ae', '#e9edc9', '#d4a373', '#faedcd', '#b68250'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 3;

    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-particle';
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.backgroundColor = color;
        p.style.left = `${centerX}px`;
        p.style.top = `${centerY}px`;

        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist + 120;
        const rot = Math.random() * 720;

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.setProperty('--rot', `${rot}deg`);

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1400);
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    
    let bgStyles = 'background-color: var(--card-surface); color: var(--text-heading); border-color: var(--border-strong);';
    let iconName = 'info';

    if (type === 'success') {
        bgStyles = 'background-color: var(--tea-green); color: var(--badge-in-stock-text); border-color: var(--badge-in-stock-border);';
        iconName = 'check-circle-2';
    } else if (type === 'warning') {
        bgStyles = 'background-color: var(--badge-out-stock-bg); color: var(--badge-out-stock-text); border-color: var(--badge-out-stock-border);';
        iconName = 'alert-triangle';
    } else if (type === 'info') {
        bgStyles = 'background-color: var(--cornsilk); color: var(--bronze-deepest); border-color: var(--light-bronze);';
        iconName = 'info';
    }

    toast.style.cssText = `${bgStyles} box-shadow: var(--shadow-lg); position: relative; overflow: hidden;`;
    toast.className = `p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 pointer-events-auto animate-fade-in`;
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-4 h-4 flex-shrink-0"></i>
        <span class="flex-1">${SecurityUtil.escapeHTML(message)}</span>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);
    safeLucide();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-6px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 260);
    }, 3200);
}
