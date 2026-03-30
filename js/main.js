/* 园企汇 - 主业务逻辑 v9.1 */

var currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initMobileMenu();
});

// 登录成功处理
function loginSuccess(user) {
    localStorage.setItem('yqh_user', JSON.stringify(user));
    currentUser = user;
    alert('登录成功');
    closeAuthModal();
    
    // 更新所有页面上的用户信息
    updateAllUserDisplays(user);
}

// 更新所有用户显示元素
function updateAllUserDisplays(user) {
    // 更新所有 user-name-display
    document.querySelectorAll('[id="user-name-display"]').forEach(function(el) {
        el.textContent = user.username || user.phone;
    });

    // 更新所有 username-display
    document.querySelectorAll('[id="username-display"]').forEach(function(el) {
        el.textContent = user.username || user.phone;
    });

    // 更新所有 user-phone-display
    document.querySelectorAll('[id="user-phone-display"]').forEach(function(el) {
        el.textContent = user.phone || '';
    });

    // 隐藏所有 guest-info，显示所有 user-info
    document.querySelectorAll('[id="guest-info"]').forEach(function(el) {
        el.style.display = 'none';
    });
    document.querySelectorAll('[id="user-info"]').forEach(function(el) {
        el.style.display = 'block';
    });

    // 隐藏登录链接，显示退出链接
    document.querySelectorAll('[id="login-link"]').forEach(function(el) {
        el.style.display = 'none';
    });
    document.querySelectorAll('[id="logout-link"]').forEach(function(el) {
        el.style.display = 'inline-flex';
    });

    // 更新移动端登录按钮为用户名
    document.querySelectorAll('.mobile-login-btn').forEach(function(el) {
        el.innerHTML = '<i class="fas fa-user"></i> ' + (user.username || user.phone);
        el.href = 'user.html';
    });
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('yqh_user');
    
    // 更新所有页面显示
    document.querySelectorAll('[id="user-info"]').forEach(function(el) {
        el.style.display = 'none';
    });
    document.querySelectorAll('[id="guest-info"]').forEach(function(el) {
        el.style.display = 'flex';
    });
    document.querySelectorAll('[id="login-link"]').forEach(function(el) {
        el.style.display = 'inline-flex';
    });
    document.querySelectorAll('[id="logout-link"]').forEach(function(el) {
        el.style.display = 'none';
    });
    
    window.location.reload();
}

// 初始化登录状态
function initAuth() {
    var savedUser = localStorage.getItem('yqh_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAllUserDisplays(currentUser);
        } catch(e) {}
    }
}

// 初始化移动端菜单
function initMobileMenu() {
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var mobileNav = document.getElementById('mobile-nav');
    var mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    var mobileNavClose = document.getElementById('mobile-nav-close');
    
    // 移动端固定顶部栏
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-header-fixed');
    }
    
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile-header-fixed');
        } else {
            document.body.classList.remove('mobile-header-fixed');
        }
    });
    
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

// 渲染房源列表
function renderListingsGrid(listings, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    if (!listings || listings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h4>暂无房源</h4></div>';
        return;
    }
    
    container.innerHTML = listings.map(function(listing) {
        var imageHtml = '<div class="no-image"><i class="fas fa-building"></i></div>';
        if (listing.images && listing.images.length > 0) {
            imageHtml = '<img src="' + listing.images[0] + '" alt="' + escapeHtml(listing.title) + '" style="width:100%;height:100%;object-fit:cover;">';
        }
        var detailUrl = 'detail.html?id=' + (listing.id || '');
        return '<div class="listing-card" onclick="window.location.href=\'' + detailUrl + '\'">' +
            '<div class="listing-image">' +
                imageHtml +
            '</div>' +
            '<div class="listing-content">' +
                '<h3><a href="' + detailUrl + '">' + escapeHtml(listing.title) + '</a></h3>' +
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

// 手机号脱敏
function sanitizePhone(phone) {
    if (!phone) return '';
    phone = String(phone);
    if (phone.length >= 11) {
        return phone.substring(0, 3) + '****' + phone.substring(7);
    }
    return phone;
}

// 加载首页
async function loadHomePage() {
    var featuredListings = document.getElementById('featured-listings');
    if (!featuredListings) return;
    
    try {
        var allListings = await getApprovedListings();
        renderListingsGrid(allListings, 'featured-listings');
    } catch(e) {
        console.error('加载失败', e);
    }
}

// 保存求租信息到云端
async function submitRentWantedRequest(request) {
    try {
        var response = await fetch(APP_CONFIG.getApiUrl('requests', 'POST'), {
            method: 'POST',
            headers: APP_CONFIG.getApiHeaders(),
            body: JSON.stringify(request)
        });
        
        if (response.ok) {
            console.log('求租信息保存成功');
            return true;
        } else {
            console.error('保存失败:', response.status);
            return false;
        }
    } catch (error) {
        console.error('保存异常:', error);
        return false;
    }
}

// 收藏相关函数
function getFavorites() {
    var data = localStorage.getItem('yqh_favorites');
    return data ? JSON.parse(data) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('yqh_favorites', JSON.stringify(favorites));
}

function isFavorite(listingId) {
    var favorites = getFavorites();
    return favorites.some(function(f) { return f.id === listingId; });
}

function addToFavorites(listing) {
    if (isFavorite(listing.id)) return false;
    var favorites = getFavorites();
    favorites.unshift(listing);
    saveFavorites(favorites);
    return true;
}

function removeFromFavorites(listingId) {
    var favorites = getFavorites();
    favorites = favorites.filter(function(f) { return f.id !== listingId; });
    saveFavorites(favorites);
}

function toggleFavorite(listingId) {
    if (!currentUser) {
        alert('请先登录');
        showLoginModal();
        return;
    }
    
    var listings = JSON.parse(localStorage.getItem('yqh_listings') || '[]');
    var listing = listings.find(function(l) { return l.id === listingId; });
    
    if (!listing) {
        console.error('房源不存在');
        return;
    }
    
    if (isFavorite(listingId)) {
        removeFromFavorites(listingId);
        alert('已取消收藏');
    } else {
        addToFavorites(listing);
        alert('已添加收藏');
    }
}

// 保存房源信息到云端
async function submitPropertyRequest(property) {
    try {
        var response = await fetch(APP_CONFIG.getApiUrl('properties'), {
            method: 'POST',
            headers: APP_CONFIG.getApiHeaders(),
            body: JSON.stringify(property)
        });
        
        if (response.ok) {
            console.log('房源信息保存成功');
            return true;
        } else {
            console.error('保存失败:', response.status);
            return false;
        }
    } catch (error) {
        console.error('保存异常:', error);
        return false;
    }
}
