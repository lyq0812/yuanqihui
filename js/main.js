/* ========================================
   园企汇 - 陕西厂房出租平台 v4.0
   本地存储版本
   ======================================== */

// currentUser 在 auth.js 中声明
let currentUser = null;
// Supabase 客户端（仅用于数据存储）
let supabaseClient = null;

// 页面加载时初始化
getSupabase();

function getSupabase() {
    if (!supabaseClient) {
        if (typeof window !== 'undefined' && window.supabase) {
            try {
                supabaseClient = window.supabase.createClient(
                    'https://tysrmpssxrdjgrubkltj.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
                );
            } catch (e) {
                supabaseClient = createMockSupabase();
            }
        } else {
            supabaseClient = createMockSupabase();
        }
    }
    return supabaseClient;
}

function createMockSupabase() {
    return {
        from: () => ({ 
            select: () => Promise.resolve({ data: [], error: 'mock_error' }), 
            insert: () => Promise.resolve({ data: null, error: 'mock_error' }), 
            update: () => ({ eq: () => Promise.resolve({ error: 'mock_error' }) }) 
        }) 
    };
}

// 仅保留电话号码常用字符，避免拼接`tel:`/HTML属性时被注入
function sanitizePhone(value) {
    if (!value) return '';
    return value.replace(/[^\d+\-\s()]/g, '');
}

// 初始化检查
function initAuth() {
    const savedUser = localStorage.getItem('yqh_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateNavForAuth();
        } catch(e) {
            console.log('解析用户数据失败', e);
        }
    }
}

// 显示登录弹窗
function showLoginModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function showAuthModal() {
    showLoginModal();
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchToLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function switchToRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

// 用户相关
// =====================

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
        localStorage.setItem('yqh_user', JSON.stringify(user));
        currentUser = user;
        updateNavForAuth();
        closeAuthModal();
        alert('登录成功');
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
        const cloudUsers = await response.json();
        
        user = cloudUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('yqh_user', JSON.stringify(user));
            currentUser = user;
            updateNavForAuth();
            closeAuthModal();
            alert('登录成功');
            
            // 保存到本地
            users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
            if (!users.find(u => u.username === username)) {
                users.push(user);
                localStorage.setItem('yqh_users', JSON.stringify(users));
            }
        } else {
            alert('密码错误');
        }
    } catch (error) {
        console.error('登录失败', error);
        alert('密码错误');
    }
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
    
    // 同时提交到云端
    try {
        await saveUserToCloud(newUser);
    } catch (e) {
        console.error('保存到云端失败', e);
    }
    
    updateNavForAuth();
    closeAuthModal();
    alert('注册成功');
}

// 保存用户到云端
async function saveUserToCloud(user) {
    try {
        const response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/users', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(user)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        return await response.json();
    } catch (error) {
        console.error('保存用户到云端失败', error);
        alert('保存到云端失败: ' + error.message);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('yqh_user');
    updateNavForAuth();
    window.location.reload();
}

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

function updateNavForAuth() {
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    
    if (!authBtn || !userInfo) return;
    
    if (currentUser) {
        authBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        const usernameSpan = document.getElementById('username-display');
        if (usernameSpan) usernameSpan.textContent = currentUser.username;
    } else {
        authBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// 数据库配置
// =====================
const DB_KEYS = {
    LISTINGS: 'yqh_listings',
    WANTED: 'yqh_rent_wanted',
    FAVORITES: 'yqh_favorites',
    USERS: 'yqh_users',
    USER: 'yqh_user'
};

// 兼容旧代码
const STORAGE_KEYS = DB_KEYS;

// 初始化数据
function initSampleData() {
    // 不再从数据库加载，避免覆盖本地数据
    // 本地数据通过 submitListing 直接保存
}

// 提交房源到数据库
async function submitListing(listing) {
    const listings = JSON.parse(localStorage.getItem(DB_KEYS.LISTINGS) || '[]');
    
    // 保持 id 一致：如果外部已生成（publish.html），就复用；否则生成一个
    if (!listing.id) listing.id = Date.now().toString();
    
    // 添加时间戳
    listing.timestamp = new Date().toISOString();
    listing.status = 'approved';
    listing.user_id = currentUser ? currentUser.id : null;
    
    // 保存到本地
    listings.push(listing);
    localStorage.setItem(DB_KEYS.LISTINGS, JSON.stringify(listings));
    
    // 同时提交到云端
    try {
        await submitListingToDB(listing);
    } catch (error) {
        console.error('保存到云端失败', error);
        alert('保存到云端失败: ' + error.message);
    }
    
    alert('提交成功');
    window.location.href = 'listings.html';
}

// 提交房源到云端数据库
async function submitListingToDB(listing) {
    try {
        const response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(listing)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        return await response.json();
    } catch (error) {
        console.error('保存到云端失败', error);
        alert('保存到云端失败: ' + error.message);
    }
}

// 提交求租到数据库
async function submitRequest(request) {
    const requests = JSON.parse(localStorage.getItem(DB_KEYS.WANTED) || '[]');
    
    // 保持 id 一致：如果外部已生成（rent-wanted-publish.html），就复用；否则生成一个
    if (!request.id) request.id = Date.now().toString();
    
    request.timestamp = new Date().toISOString();
    request.status = 'approved';
    request.user_id = currentUser ? currentUser.id : null;
    
    // 保存到本地
    requests.push(request);
    localStorage.setItem(DB_KEYS.WANTED, JSON.stringify(requests));
    
    // 同时提交到云端
    try {
        await submitRequestToDB(request);
    } catch (error) {
        console.error('保存到云端失败', error);
    }
    
    alert('提交成功');
    window.location.href = 'rent-wanted-list.html';
}

// 提交求租到云端
async function submitRequestToDB(request) {
    try {
        const response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/requests', {
            method: 'POST',
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }
        
        return await response.json();
    } catch (error) {
        console.error('保存到云端失败', error);
        alert('保存到云端失败: ' + error.message);
    }
}

// 格式化价格
function formatPrice(price) {
    if (!price) return '面议';
    if (price === '0') return '面议';
    if (typeof price === 'string' && price.includes('-')) {
        return price.replace('-', '-') + '元';
    }
    return price.toLocaleString('zh-CN');
}

// 房源筛选
// =====================

function applyFilters() {
    const region = document.getElementById('filter-region')?.value || '';
    const type = document.getElementById('filter-type')?.value || '';
    const areaMin = parseInt(document.getElementById('filter-area-min')?.value) || 0;
    const areaMax = parseInt(document.getElementById('filter-area-max')?.value || Infinity);
    const priceMin = parseInt(document.getElementById('filter-price-min')?.value) || 0;
    const priceMax = parseInt(document.getElementById('filter-price-max')?.value || Infinity);
    
    const filtered = allListings.filter(listing => {
        if (region && listing.region !== region) return false;
        if (type && listing.type !== type) return false;
        
        const area = parseInt(listing.area) || 0;
        if (area < areaMin || area > areaMax) return false;
        
        const priceNum = parseInt(listing.price) || 0;
        if (priceMin && priceNum < priceMin) return false;
        if (priceMax !== Infinity && priceNum > priceMax) return false;
        
        return true;
    });
    
    renderListings(filtered);
}

function renderListings(listings) {
    const container = document.getElementById('listings-grid');
    if (!container) return;
    
    if (listings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h4>暂无符合条件的房源</h4><p>请尝试调整筛选条件或发布您的房源</p></div>';
        return;
    }
    
    container.innerHTML = listings.map(listing => {
        const tags = listing.tags || [];
        return `
            <div class="listing-card">
                <div class="listing-image">
                    ${listing.images && listing.images[0] ? 
                        `<img src="${listing.images[0]}" alt="${escapeHtml(listing.title)}" onerror="this.src='https://via.placeholder.com/400x300?text=无图片'">` : 
                        '<div class="no-image"><i class="fas fa-building"></i></div>'
                    }
                    ${listing.price === '面议' || listing.price === '0' ? '<span class="price-tag">可议价</span>' : ''}
                </div>
                <div class="listing-content">
                    <h3><a href="detail.html?id=${listing.id}">${escapeHtml(listing.title)}</a></h3>
                    <div class="listing-info">
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(listing.region || '未知地区')}</span>
                        <span><i class="fas fa-vector-square"></i> ${escapeHtml(listing.area)}㎡</span>
                        <span><i class="fas fa-ruler-vertical"></i> ${escapeHtml(listing.height || 6)}m</span>
                    </div>
                    <div class="listing-tags">
                        ${tags.includes('可分割') ? '<span class="listing-tag divisible">可分割</span>' : ''}
                        ${tags.includes('丙二类消防') ? '<span class="listing-tag fire-safety">丙二类</span>' : ''}
                        ${tags.includes('可办环评') ? '<span class="listing-tag eia">可办环评</span>' : ''}
                        ${tags.includes('独门独院') ? '<span class="listing-tag exclusive">独门独院</span>' : ''}
                    </div>
                    <div class="listing-footer">
                        <div class="listing-price">¥${formatPrice(listing.price)}<span>/月</span></div>
                        <a href="detail.html?id=${listing.id}" class="btn-detail">查看详情</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderListingsGrid(listings, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (listings.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h4>暂无房源</h4></div>';
        return;
    }
    
    container.innerHTML = listings.map(listing => `
        <div class="listing-card">
            <div class="listing-image">
                ${listing.images && listing.images[0] ? 
                    `<img src="${listing.images[0]}" alt="${escapeHtml(listing.title)}" onerror="this.src='https://via.placeholder.com/400x300?text=无图片'">` : 
                    '<div class="no-image"><i class="fas fa-building"></i></div>'
                }
            </div>
            <div class="listing-content">
                <h3><a href="detail.html?id=${listing.id}">${escapeHtml(listing.title)}</a></h3>
                <div class="listing-info">
                    <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(listing.region)}</span>
                    <span><i class="fas fa-vector-square"></i> ${escapeHtml(listing.area)}㎡</span>
                    <span><i class="fas fa-ruler-vertical"></i> ${escapeHtml(listing.height || 6)}m</span>
                </div>
                <div class="listing-footer">
                    <div class="listing-price">¥${formatPrice(listing.price)}<span>/月</span></div>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(DB_KEYS.FAVORITES) || '[]');
    const index = favorites.indexOf(id);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('已取消收藏');
    } else {
        favorites.push(id);
        showToast('已收藏');
    }
    
    localStorage.setItem(DB_KEYS.FAVORITES, JSON.stringify(favorites));
}

function isFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem(DB_KEYS.FAVORITES) || '[]');
    return favorites.includes(id);
}

// 详情页渲染
// =====================

async function renderDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        document.getElementById('detail-content').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>房源不存在或已下架</h4><a href="listings.html" class="btn-call" style="display:inline-flex;margin-top:20px;">返回房源列表</a></div>';
        return;
    }
    
    // 详情页需要展示"合并后的数据"（云端 approved + 本地 approved），否则很容易在本地找不到
    const listings = await getApprovedListings();
    const listing = listings.find(l => l.id === id);
    
    if (!listing) {
        document.getElementById('detail-content').innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>房源不存在或已下架</h4><a href="listings.html" class="btn-call" style="display:inline-flex;margin-top:20px;">返回房源列表</a></div>';
        return;
    }
    
    const tags = listing.tags || [];
    document.getElementById('detail-content').innerHTML = `
        <div class="detail-header">
            <h1>${escapeHtml(listing.title)}</h1>
            <div class="detail-price">¥${formatPrice(listing.price)}<span>/月</span></div>
        </div>
        
        <div class="detail-info">
            <div class="info-item">
                <label>面积</label>
                <span>${escapeHtml(listing.area)}㎡</span>
            </div>
            <div class="info-item">
                <label>层高</label>
                <span>${escapeHtml(listing.height || '6')}m</span>
            </div>
            <div class="info-item">
                <label>类型</label>
                <span>${escapeHtml(listing.type)}</span>
            </div>
            <div class="info-item">
                <label>地区</label>
                <span>${escapeHtml(listing.region)}</span>
            </div>
            <div class="info-item">
                <label>位置</label>
                <span>${escapeHtml(listing.location)}</span>
            </div>
            <div class="info-item">
                <label>价格</label>
                <span class="price">¥${formatPrice(listing.price)}/<small>月</small></span>
            </div>
        </div>
        
        ${tags.length > 0 ? `
        <div class="detail-tags">
            ${tags.includes('可分割') ? '<span class="tag">可分割</span>' : ''}
            ${tags.includes('丙二类消防') ? '<span class="tag">丙二类消防</span>' : ''}
            ${tags.includes('可办环评') ? '<span class="tag">可办环评</span>' : ''}
            ${tags.includes('独门独院') ? '<span class="tag">独门独院</span>' : ''}
        </div>
        ` : ''}
        
        <div class="detail-section">
            <h3>房源描述</h3>
            <p>${escapeHtml(listing.description) || '暂无详细描述'}</p>
        </div>
        
        <div class="detail-contact">
            <h3>联系方式</h3>
            <p><i class="fas fa-user"></i> ${escapeHtml(listing.contact || '暂无')}</p>
            <p><i class="fas fa-phone"></i> <a href="tel:${sanitizePhone(listing.contact)}">${escapeHtml(listing.contact)}</a></p>
        </div>
        
        <div class="detail-actions">
            <a href="tel:${sanitizePhone(listing.contact)}" class="btn-call"><i class="fas fa-phone"></i> 联系房东</a>
            <button class="btn-favorite ${isFavorite(listing.id) ? 'active' : ''}" onclick="toggleFavorite('${listing.id}')">
                <i class="fas fa-heart"></i> ${isFavorite(listing.id) ? '已收藏' : '收藏'}
            </button>
        </div>
    `;
}

// 发布页处理
// =====================

function initPublishForm() {
    const form = document.getElementById('publish-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showLoginModal();
            return;
        }
        
        const listing = {
            title: document.getElementById('title').value,
            region: document.getElementById('region').value,
            area: document.getElementById('area').value,
            height: document.getElementById('height').value,
            type: document.getElementById('type').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            contact: document.getElementById('contact').value,
            description: document.getElementById('description').value,
            tags: []
        };
        
        if (document.getElementById('tag-divisible').checked) listing.tags.push('可分割');
        if (document.getElementById('tag-fire').checked) listing.tags.push('丙二类消防');
        if (document.getElementById('tag-eia').checked) listing.tags.push('可办环评');
        if (document.getElementById('tag-exclusive').checked) listing.tags.push('独门独院');
        
        await submitListing(listing);
    });
}

// Toast 提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 从云端获取已批准的房源
async function getApprovedListingsFromDB() {
    try {
        const response = await fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取云端数据失败', error);
        return [];
    }
}

// 缓存
let cachedListings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30秒缓存

async function getApprovedListings() {
    const now = Date.now();
    if (!cachedListings || (now - lastFetchTime) > CACHE_DURATION) {
        const dbListings = await getApprovedListingsFromDB();
        const localListings = getListings().filter(item => item.status === 'approved');
        
        const allListings = [...dbListings];
        localListings.forEach(local => {
            if (!allListings.find(l => l.id === local.id)) {
                allListings.push(local);
            }
        });
        
        cachedListings = allListings;
        lastFetchTime = now;
    }
    return cachedListings;
}

function getListings() {
    const data = localStorage.getItem(DB_KEYS.LISTINGS);
    return data ? JSON.parse(data) : [];
}

function getWantedList() {
    const data = localStorage.getItem(DB_KEYS.WANTED);
    return data ? JSON.parse(data) : [];
}

// 加载首页
async function loadHomePage() {
    // 先获取云端数据
    const allListings = await getApprovedListings();
    
    // 渲染推荐房源
    const featuredListings = document.getElementById('featured-listings');
    if (featuredListings) {
        renderListingsGrid(allListings.slice(0, 6), 'featured-listings');
    }
}

// 初始化
// =====================
document.addEventListener('DOMContentLoaded', function() {
    initSampleData();
    
    // 移动端菜单功能
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');
    
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
    
    // 移动端筛选
    const filterToggle = document.getElementById('filter-toggle');
    const filterPanel = document.getElementById('filter-panel');
    
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }
    
    // 登录按钮
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.onclick = showLoginModal;
    }
    
    // 加载首页数据
    loadHomePage();
});
