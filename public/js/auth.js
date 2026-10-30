/**
 * StockPulse NextGen - Authentication & Session Security Manager
 * Seamlessly handles path resolution for GitHub Pages sub-directories
 */

const AuthManager = {
    currentUser: null,
    token: null,

    init() {
        const storedUser = localStorage.getItem('stockpulse_current_user');
        const storedToken = localStorage.getItem('stockpulse_auth_token');

        if (storedUser && storedToken) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.token = storedToken;
            } catch (e) {
                this.logout();
                return;
            }
        }

        this.applyRouteGuard();
        this.renderUserUI();
    },

    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    },

    applyRouteGuard() {
        // Resolve filename irrespective of GitHub Pages subpaths
        const pathSegments = window.location.pathname.split('/');
        const currentPage = (pathSegments[pathSegments.length - 1] || 'index.html').toLowerCase();
        const isAuthPage = currentPage === 'login.html' || currentPage === 'login';

        if (!this.isAuthenticated() && !isAuthPage) {
            // Unauthenticated user attempting to access dashboard
            window.location.href = 'login.html';
        } else if (this.isAuthenticated() && isAuthPage) {
            // Already logged in user visiting login page
            window.location.href = 'index.html';
        }
    },

    setSession(user, token) {
        this.currentUser = user;
        this.token = token;
        localStorage.setItem('stockpulse_current_user', JSON.stringify(user));
        localStorage.setItem('stockpulse_auth_token', token);
    },

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('stockpulse_current_user');
        localStorage.removeItem('stockpulse_auth_token');
        window.location.href = 'login.html';
    },

    renderUserUI() {
        const nameEl = document.getElementById('user-profile-name');
        const roleEl = document.getElementById('user-profile-role');
        const avatarEl = document.getElementById('user-profile-avatar');
        const dropdownEmailEl = document.getElementById('dropdown-user-email');

        if (this.currentUser) {
            if (nameEl) nameEl.innerText = this.currentUser.name || 'User';
            if (roleEl) roleEl.innerText = this.currentUser.role || 'Inventory Specialist';
            if (dropdownEmailEl) dropdownEmailEl.innerText = this.currentUser.email || 'Active';
            if (avatarEl) {
                const initials = (this.currentUser.name || 'SP')
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                avatarEl.innerText = initials || 'SP';
            }
        }
    }
};

window.AuthManager = AuthManager;
