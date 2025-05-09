// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Get user role
function getUserRole() {
    return localStorage.getItem('role');
}

// Check if current page requires authentication
function checkAuthRequired() {
    const publicPages = ['/', '/index.html', '/login.html', '/register.html'];
    const currentPath = window.location.pathname;
    
    // If authenticated and trying to access login/register, redirect to index
    if (isAuthenticated() && (currentPath === '/login.html' || currentPath === '/register.html')) {
        window.location.href = '/index.html';
        return;
    }

    // If not authenticated and trying to access protected page, redirect to login
    if (!publicPages.includes(currentPath) && !isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Role-based access control
    const role = getUserRole();
    if (isAuthenticated()) {
        // Pages only doctors and patients can access
        if (['/assessment.html', '/scan.html'].includes(currentPath)) {
            if (!(role === 'doctor' || role === 'patient')) {
                window.location.href = '/index.html';
                return;
            }
        }
        
        // Pages only doctors and caregivers can access
        if (['/prediction-history.html'].includes(currentPath)) {
            if (!(role === 'doctor' || role === 'caregiver')) {
                window.location.href = '/index.html';
                return;
            }
        }
    }
}

// Update navigation based on authentication status
function updateNavigation() {
    const isLoggedIn = isAuthenticated();
    const role = getUserRole();
    
    // Get navigation elements
    const loginBtn = document.querySelector('.login-btn');
    const logoutBtn = document.querySelector('.logout-btn');
    const assessmentLink = document.querySelector('.assessment-link');
    const historyLink = document.querySelector('.history-link');

    if (isLoggedIn) {
        // Show logout, hide login
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Show/hide features based on role
        if (assessmentLink) {
            assessmentLink.style.display = (role === 'patient' || role === 'doctor') ? 'inline-block' : 'none';
        }
        if (historyLink) {
            historyLink.style.display = (role === 'doctor' || role === 'caregiver') ? 'inline-block' : 'none';
        }
    } else {
        // Show login, hide logout and restricted features
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (assessmentLink) assessmentLink.style.display = 'none';
        if (historyLink) historyLink.style.display = 'none';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = '/login.html';
}

// Add auth header to fetch requests
function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
}

// Check authentication when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthRequired();
    updateNavigation();
}); 