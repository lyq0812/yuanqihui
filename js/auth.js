// 园企汇 - 统一登录系统 v5.0
// 包含所有登录、注册、云端同步功能

let currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    createAuthModal();
    setupLoginButtons();
});

function initAuth() {
    const savedUser = localStorage.getItem('yqh_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateAllNavForAuth();
        } catch(e) {
            console.log('解析用户数据失败', e);
        }
    }
}

// 动态创建登录弹窗（所有页面通用）
function createAuthModal() {
    if (document.getElementById('auth-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;';
    modal.innerHTML = `
        <div style="background:white;padding:30px;border-radius:10px;width:90%;max-width:380px;position:relative;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
            <button onclick="closeAuthModal()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:1.5rem;cursor:pointer;color:#999;">×</button>
            <div style="text-align:center;margin-bottom:1.5rem;">
                <i class="fas fa-user-circle" style="font-size:3rem;color:#4F46E5;"></i>
                <h3 id="auth-title" style="margin:10px 0 0 0;">用户登录</h3>
            </div>
            
            <!-- 登录表单 -->
            <div id="login-form-content">
                <form onsubmit="event.preventDefault(); doLogin();">
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">用户名 / 手机号</label>
                        <input type="text" id="login-username" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入用户名或手机号" required>
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">密码</label>
                        <input type="password" id="login-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入密码" required>
                    </div>
                    <button type="submit" style="width:100%;padding:14px;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;">登 录</button>
                </form>
                <p style="text-align:center;margin-top:1rem;color:#666;">
                    还没有账号？<a href="#" onclick="showRegister();return false;" style="color:#4F46E5;text-decoration:none;font-weight:600;">立即注册</a>
                </p>
            </div>
            
            <!-- 注册表单 -->
            <div id="register-form-content" style="display:none;">
                <form onsubmit="event.preventDefault(); doRegister();">
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">用户名</label>
                        <input type="text" id="reg-username" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请设置用户名（4-20个字符）" required minlength="4" maxlength="20">
                    </div>
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">手机号码</label>
                        <input type="tel" id="reg-phone" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入11位手机号码" required pattern="1[3-9]\\d{9}">
                    </div>
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">密码</label>
                        <input type="password" id="reg-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请设置登录密码（6-20个字符）" required minlength="6">
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">确认密码</label>
                        <input type="password" id="reg-confirm-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请再次输入密码" required>
                    </div>
                    <button type="submit" style="width:100%;padding:14px;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;">注 册</button>
                </form>
                <p style="text-align:center;margin-top:1rem;color:#666;">
                    已有账号？<a href="#" onclick="showLogin();return false;" style="color:#4F46E5;text-decoration:none;font-weight:600;">立即登录</a>
                </p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 设置所有页面的登录按钮
function setupLoginButtons() {
    // 找到所有需要触发登录的按钮
    document.querySelectorAll('[onclick*="showLoginModal"], [onclick*="showAuthModal"], .auth-btn, [data-login]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            showAuthModal();
        });
    });
    
    // 为没有onclick的登录链接添加事件
    document.querySelectorAll('a[href*="login"], a[href*="auth"]').forEach(link => {
        if (!link.getAttribute('onclick')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showAuthModal();
            });
        }
    });
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function showLoginModal() {
    showAuthModal();
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showLogin() {
    document.getElementById('login-form-content').style.display = 'block';
    document.getElementById('register-form-content').style.display = 'none';
    document.getElementById('auth-title').textContent = '用户登录';
}

function showRegister() {
    document.getElementById('login-form-content').style.display = 'none';
    document.getElementById('register-form-content').style.display = 'block';
    document.getElementById('auth-title').textContent = '用户注册';
}

// 登录函数
async function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('请填写用户名和密码');
        return;
    }
    
    // 先检查本地
    let users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    let user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        loginSuccess(user);
        return;
    }
    
    // 检查云端
    try {
        const response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/users?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
            }
        });
        
        if (response.ok) {
            const cloudUsers = await response.json();
            console.log('云端用户数据:', cloudUsers);
            
            if (Array.isArray(cloudUsers)) {
                // 先按手机号查找
                user = cloudUsers.find(u => u.phone === username && u.password === password);
                // 再按用户名查找
                if (!user) {
                    user = cloudUsers.find(u => u.username === username && u.password === password);
                }
                console.log('查找结果:', user);
            }
        }
        
        if (user) {
            // 保存到本地
            users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
            if (!users.find(u => u.username === user.username)) {
                users.push(user);
                localStorage.setItem('yqh_users', JSON.stringify(users));
            }
            loginSuccess(user);
        } else {
            alert('用户名或密码错误');
        }
    } catch (error) {
        console.error('登录失败', error);
        alert('用户名或密码错误');
    }
}

function loginSuccess(user) {
    localStorage.setItem('yqh_user', JSON.stringify(user));
    currentUser = user;
    updateAllNavForAuth();
    closeAuthModal();
    alert('登录成功');
    window.location.reload();
}

// 注册函数
async function doRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    
    if (!username || username.length < 4) {
        alert('用户名至少需要4个字符');
        return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
        alert('请输入正确的手机号码');
        return;
    }
    if (!password || password.length < 6) {
        alert('密码至少需要6个字符');
        return;
    }
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 检查本地
    let users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    let existingUser = users.find(u => u.username === username || u.phone === phone);
    if (existingUser) {
        alert('用户名或手机号已被注册');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: 'usr_' + Date.now(),
        username: username,
        phone: phone,
        password: password,
        role: 'user',
        created_at: new Date().toISOString()
    };
    
    // 保存到本地
    users.push(newUser);
    localStorage.setItem('yqh_users', JSON.stringify(users));
    localStorage.setItem('yqh_user', JSON.stringify(newUser));
    currentUser = newUser;
    
    // 保存到云端
    try {
        await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/users', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(newUser)
        });
    } catch (e) {
        console.error('保存到云端失败', e);
    }
    
    updateAllNavForAuth();
    closeAuthModal();
    alert('注册成功');
    window.location.reload();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('yqh_user');
    updateAllNavForAuth();
    window.location.reload();
}

function updateAllNavForAuth() {
    // 更新所有可能的导航元素
    const authBtns = document.querySelectorAll('#auth-btn, .auth-btn, [id*="auth-"]');
    const userInfos = document.querySelectorAll('#user-info, .user-info, [id*="user-info-"]');
    const userNames = document.querySelectorAll('#username-display, .username-display, [id*="username-"]');
    
    if (currentUser) {
        authBtns.forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
        userInfos.forEach(info => {
            if (info) {
                info.style.display = 'flex';
                info.classList.add('logged-in');
            }
        });
        userNames.forEach(span => {
            if (span) span.textContent = currentUser.username || currentUser.phone;
        });
        
        // 更新登录/注册链接
        const loginLinks = document.querySelectorAll('.login-link, [id="login-link"], [class*="login-link"]');
        const logoutLinks = document.querySelectorAll('.logout-link, [id="logout-link"], [class*="logout-link"]');
        
        loginLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
        logoutLinks.forEach(link => {
            if (link) link.style.display = 'inline-flex';
        });
    } else {
        authBtns.forEach(btn => {
            if (btn) btn.style.display = 'block';
        });
        userInfos.forEach(info => {
            if (info) {
                info.style.display = 'none';
                info.classList.remove('logged-in');
        });
        
        const loginLinks = document.querySelectorAll('.login-link, [id="login-link"], [class*="login-link"]');
        const logoutLinks = document.querySelectorAll('.logout-link, [id="logout-link"], [class*="logout-link"]');
        
        loginLinks.forEach(link => {
            if (link) link.style.display = 'inline-flex';
        });
        logoutLinks.forEach(link => {
            if (link) link.style.display = 'none';
        });
    }
}

// 数据库配置
const DB_KEYS = {
    LISTINGS: 'yqh_listings',
    WANTED: 'yqh_rent_wanted',
    FAVORITES: 'yqh_favorites',
    USERS: 'yqh_users',
    USER: 'yqh_user'
};

const SUPABASE_URL = 'https://tysrmpssxrdjgrubkltj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc';

// 提交房源
async function submitListing(listing) {
    const listings = JSON.parse(localStorage.getItem(DB_KEYS.LISTINGS) || '[]');
    
    if (!listing.id) listing.id = Date.now().toString();
    
    listing.timestamp = new Date().toISOString();
    listing.status = 'approved';
    listing.user_id = currentUser ? currentUser.id : null;
    
    listings.push(listing);
    localStorage.setItem(DB_KEYS.LISTINGS, JSON.stringify(listings));
    
    // 提交到云端
    try {
        await fetch(SUPABASE_URL + '/rest/v1/properties', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(listing)
        });
    } catch (error) {
        console.error('保存到云端失败', error);
    }
    
    alert('提交成功');
    window.location.href = 'listings.html';
}

// 提交求租
async function submitRequest(request) {
    const requests = JSON.parse(localStorage.getItem(DB_KEYS.WANTED) || '[]');
    
    if (!request.id) request.id = Date.now().toString();
    
    request.timestamp = new Date().toISOString();
    request.status = 'approved';
    request.user_id = currentUser ? currentUser.id : null;
    
    requests.push(request);
    localStorage.setItem(DB_KEYS.WANTED, JSON.stringify(requests));
    
    try {
        await fetch(SUPABASE_URL + '/rest/v1/requests', {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(request)
        });
    } catch (error) {
        console.error('保存到云端失败', error);
    }
    
    alert('提交成功');
    window.location.href = 'rent-wanted-list.html';
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
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

// 获取云端房源
async function getApprovedListings() {
    try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/properties?select=*', {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });
        
        let dbListings = [];
        if (response.ok) {
            dbListings = await response.json();
        }
        
        const localListings = JSON.parse(localStorage.getItem(DB_KEYS.LISTINGS) || '[]');
        
        const allListings = [...dbListings];
        localListings.forEach(local => {
            if (!allListings.find(l => l.id === local.id)) {
                allListings.push(local);
            }
        });
        
        return allListings;
    } catch (error) {
        console.error('获取云端数据失败', error);
        return JSON.parse(localStorage.getItem(DB_KEYS.LISTINGS) || '[]');
    }
}

// 获取云端求租
async function getApprovedRequests() {
    try {
        const response = await fetch(SUPABASE_URL + '/rest/v1/requests?select=*', {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });
        
        let dbRequests = [];
        if (response.ok) {
            dbRequests = await response.json();
        }
        
        const localRequests = JSON.parse(localStorage.getItem(DB_KEYS.WANTED) || '[]');
        
        const allRequests = [...dbRequests];
        localRequests.forEach(local => {
            if (!allRequests.find(r => r.id === local.id)) {
                allRequests.push(local);
            }
        });
        
        return allRequests;
    } catch (error) {
        console.error('获取云端数据失败', error);
        return JSON.parse(localStorage.getItem(DB_KEYS.WANTED) || '[]');
    }
}

// 删除房源
async function deleteListing(id) {
    if (!confirm('确定删除此房源吗？')) return;
    
    // 删除云端
    try {
        await fetch(SUPABASE_URL + '/rest/v1/properties?id=eq.' + id, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });
    } catch (e) {}
    
    // 删除本地
    let list = JSON.parse(localStorage.getItem(DB_KEYS.LISTINGS) || '[]');
    list = list.filter(l => l.id !== id);
    localStorage.setItem(DB_KEYS.LISTINGS, JSON.stringify(list));
    
    alert('删除成功');
    window.location.reload();
}

// 删除求租
async function deleteRequest(id) {
    if (!confirm('确定删除此求租信息吗？')) return;
    
    try {
        await fetch(SUPABASE_URL + '/rest/v1/requests?id=eq.' + id, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY
            }
        });
    } catch (e) {}
    
    let list = JSON.parse(localStorage.getItem(DB_KEYS.WANTED) || '[]');
    list = list.filter(r => r.id !== id);
    localStorage.setItem(DB_KEYS.WANTED, JSON.stringify(list));
    
    alert('删除成功');
    window.location.reload();
}

// Toast提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:99999;animation:fadeIn 0.3s;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
