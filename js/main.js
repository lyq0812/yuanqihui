/* 园企汇 - 统一登录系统 v8 */

var currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initMobileMenu();
    createAuthModalIfNeeded();
});

// 创建登录弹窗（如果页面没有）
function createAuthModalIfNeeded() {
    if (document.getElementById('auth-modal')) return;
    
    var modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;';
    modal.innerHTML = 
        '<div style="background:white;padding:30px;border-radius:10px;width:90%;max-width:380px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.2);">' +
            '<button onclick="closeAuthModal()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#999;">×</button>' +
            '<div style="text-align:center;margin-bottom:1.5rem;">' +
                '<i class="fas fa-user-circle" style="font-size:3rem;color:#4F46E5;"></i>' +
                '<h3 id="auth-title" style="margin:10px 0 0 0;">用户登录</h3>' +
            '</div>' +
            '<div id="login-form-content">' +
                '<form onsubmit="return handleLogin(event);">' +
                    '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">用户名 / 手机号</label><input type="text" id="login-username" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入用户名或手机号" required></div>' +
                    '<div style="margin-bottom:1.5rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">密码</label><input type="password" id="login-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入密码" required></div>' +
                    '<button type="submit" style="width:100%;padding:14px;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;">登 录</button>' +
                '</form>' +
                '<p style="text-align:center;margin-top:1rem;color:#666;">还没有账号？<a href="#" onclick="showRegister();return false;" style="color:#4F46E5;text-decoration:none;font-weight:600;">立即注册</a></p>' +
            '</div>' +
            '<div id="register-form-content" style="display:none;">' +
                '<form onsubmit="return handleRegister(event);">' +
                    '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">用户名</label><input type="text" id="reg-username" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请设置用户名（4-20个字符）" required minlength="4" maxlength="20"></div>' +
                    '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">手机号码</label><input type="tel" id="reg-phone" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入11位手机号码" required></div>' +
                    '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">密码</label><input type="password" id="reg-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请设置登录密码（6-20个字符）" required minlength="6"></div>' +
                    '<div style="margin-bottom:1.5rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">确认密码</label><input type="password" id="reg-confirm-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请再次输入密码" required></div>' +
                    '<button type="submit" style="width:100%;padding:14px;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;">注 册</button>' +
                '</form>' +
                '<p style="text-align:center;margin-top:1rem;color:#666;">已有账号？<a href="#" onclick="showLogin();return false;" style="color:#4F46E5;text-decoration:none;font-weight:600;">立即登录</a></p>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
}

// 显示登录弹窗
function showLoginModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
}

// 关闭登录弹窗
function closeAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

// 显示注册
function showRegister() {
    document.getElementById('login-form-content').style.display = 'none';
    document.getElementById('register-form-content').style.display = 'block';
    document.getElementById('auth-title').textContent = '用户注册';
}

// 显示登录
function showLogin() {
    document.getElementById('login-form-content').style.display = 'block';
    document.getElementById('register-form-content').style.display = 'none';
    document.getElementById('auth-title').textContent = '用户登录';
}

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('请填写用户名和密码');
        return false;
    }
    
    // 先检查本地
    var users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    var user = users.find(function(u) { return u.username === username && u.password === password; });
    
    if (!user) {
        user = users.find(function(u) { return u.phone === username && u.password === password; });
    }
    
    if (user) {
        loginSuccess(user);
        return false;
    }
    
    // 检查云端
    fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/users?select=*', {
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
        }
    })
    .then(function(response) { return response.json(); })
    .then(function(cloudUsers) {
        if (Array.isArray(cloudUsers)) {
            user = cloudUsers.find(function(u) { return u.phone === username && u.password === password; });
            if (!user) {
                user = cloudUsers.find(function(u) { return u.username === username && u.password === password; });
            }
        }
        
        if (user) {
            users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
            if (!users.find(function(u) { return u.username === user.username; })) {
                users.push(user);
                localStorage.setItem('yqh_users', JSON.stringify(users));
            }
            loginSuccess(user);
        } else {
            alert('用户名或密码错误');
        }
    })
    .catch(function(error) {
        console.error('登录失败', error);
        alert('用户名或密码错误');
    });
    
    return false;
}

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
}

// 处理注册
function handleRegister(e) {
    e.preventDefault();
    var username = document.getElementById('reg-username').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    var password = document.getElementById('reg-password').value;
    var confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!username || username.length < 4) {
        alert('用户名至少需要4个字符');
        return false;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的手机号码');
        return false;
    }
    if (!password || password.length < 6) {
        alert('密码至少需要6个字符');
        return false;
    }
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return false;
    }
    
    var users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    var existingUser = users.find(function(u) { return u.username === username || u.phone === phone; });
    if (existingUser) {
        alert('用户名或手机号已被注册');
        return false;
    }
    
    var newUser = {
        id: 'usr_' + Date.now(),
        username: username,
        phone: phone,
        password: password,
        role: 'user',
        created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('yqh_users', JSON.stringify(users));
    localStorage.setItem('yqh_user', JSON.stringify(newUser));
    
    // 保存到云端
    fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/users', {
        method: 'POST',
        headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(newUser)
    }).catch(function(e) {});
    
    alert('注册成功');
    loginSuccess(newUser);
    return false;
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

// 获取云端+本地房源
async function getApprovedListings() {
    console.log('正在获取云端房源...');
    try {
        var response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
            }
        });
        
        console.log('响应状态:', response.status);
        var dbListings = [];
        if (response.ok) {
            dbListings = await response.json();
            console.log('云端房源数量:', dbListings.length);
        } else {
            console.error('获取失败，状态码:', response.status);
        }
        
        var localListings = JSON.parse(localStorage.getItem('yqh_listings') || '[]');
        
        // 去重
        var allListings = [];
        var seen = {};
        dbListings.concat(localListings).forEach(function(item) {
            var key = String(item.id);
            if (!seen[key]) {
                seen[key] = true;
                allListings.push(item);
            }
        });
        return allListings;
    } catch (error) {
        console.error('获取数据失败', error);
        return JSON.parse(localStorage.getItem('yqh_listings') || '[]');
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
        return '<div class="listing-card">' +
            '<div class="listing-image">' +
                imageHtml +
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

// 格式化价格
function formatPrice(price) {
    if (!price) return '面议';
    if (price === '0') return '面议';
    return price.toLocaleString('zh-CN');
}

// HTML转义
function escapeHtml(value) {
    if (!value) return '';
    var div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

// 获取URL参数
function getUrlParam(name) {
    var url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
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

// 保存求租信息到云端
async function submitRentWantedRequest(request) {
    try {
        var response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/requests', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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

// 保存房源信息到云端
async function submitPropertyRequest(property) {
    try {
        var response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
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
