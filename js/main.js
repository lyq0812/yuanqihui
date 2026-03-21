/* 园企汇 - 陕西厂房出租平台 */

var currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initMobileMenu();
    loadHomePage();
});

function initAuth() {
    var savedUser = localStorage.getItem('yqh_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateNavForAuth();
        } catch(e) {}
    }
}

function updateNavForAuth() {
    var authBtn = document.getElementById('auth-btn');
    var userInfo = document.getElementById('user-info');
    if (!authBtn || !userInfo) return;
    
    if (currentUser) {
        authBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        var usernameSpan = document.getElementById('username-display');
        if (usernameSpan) usernameSpan.textContent = currentUser.username;
    } else {
        authBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

function initMobileMenu() {
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var mobileNav = document.getElementById('mobile-nav');
    var mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    var mobileNavClose = document.getElementById('mobile-nav-close');
    
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.style.left = '0';
            if (mobileNavOverlay) mobileNavOverlay.classList.add('active');
        });
    }
    
    if (mobileNavClose && mobileNav) {
        mobileNavClose.addEventListener('click', function() {
            mobileNav.style.left = '-100%';
            if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');
        });
    }
    
    if (mobileNavOverlay && mobileNav) {
        mobileNavOverlay.addEventListener('click', function() {
            mobileNav.style.left = '-100%';
            mobileNavOverlay.classList.remove('active');
        });
    }
}

// 加载首页
async function loadHomePage() {
    var featuredListings = document.getElementById('featured-listings');
    if (!featuredListings) return;
    
    try {
        var allListings = await getApprovedListings();
        renderListingsGrid(allListings.slice(0, 6), 'featured-listings');
    } catch(e) {
        console.error('加载失败', e);
    }
}

// 获取云端+本地房源
async function getApprovedListings() {
    try {
        var response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
            }
        });
        
        var dbListings = [];
        if (response.ok) {
            dbListings = await response.json();
        }
        
        var localListings = JSON.parse(localStorage.getItem('yqh_listings') || '[]');
        
        var allListings = dbListings.concat(localListings);
        return allListings;
    } catch (error) {
        console.error('获取数据失败', error);
        return JSON.parse(localStorage.getItem('yqh_listings') || '[]');
    }
}

function renderListingsGrid(listings, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    if (!listings || listings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h4>暂无房源</h4></div>';
        return;
    }
    
    container.innerHTML = listings.map(function(listing) {
        return '<div class="listing-card">' +
            '<div class="listing-image">' +
                '<div class="no-image"><i class="fas fa-building"></i></div>' +
            '</div>' +
            '<div class="listing-content">' +
                '<h3><a href="detail.html?id=' + listing.id + '">' + escapeHtml(listing.title) + '</a></h3>' +
                '<div class="listing-info">' +
                    '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(listing.region) + '</span>' +
                    '<span><i class="fas fa-vector-square"></i> ' + escapeHtml(listing.area) + '㎡</span>' +
                '</div>' +
                '<div class="listing-footer">' +
                    '<div class="listing-price">¥' + formatPrice(listing.price) + '<span>/月</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

function formatPrice(price) {
    if (!price) return '面议';
    if (price === '0') return '面议';
    return price.toLocaleString('zh-CN');
}

function escapeHtml(value) {
    if (!value) return '';
    var div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function getUrlParam(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
}

function showLoginModal() {
    if (typeof window.showAuthModal === 'function') {
        window.showAuthModal();
    } else if (typeof showAuthModal === 'function') {
        showAuthModal();
    } else {
        // 手动触发auth.js的弹窗
        var modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else if (typeof window.createAuthModal === 'function') {
            window.createAuthModal();
            setTimeout(function() {
                var m = document.getElementById('auth-modal');
                if (m) m.style.display = 'flex';
            }, 100);
        }
    }
}
