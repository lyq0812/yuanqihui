// 园企汇 - 统一登录系统 v7.0 (极致性能优化版)

(function() {
    // 确保配置文件已加载
    if (typeof window.APP_CONFIG === 'undefined') {
        console.error('配置文件未加载，请在HTML中先引入config.js');
    }

    // ========== 缓存配置 (1小时有效期) ==========
    var LISTINGS_CACHE_KEY = 'yqh_listings_cache';
    var REQUESTS_CACHE_KEY = 'yqh_requests_cache';
    var CACHE_EXPIRY = 60 * 60 * 1000; // 1小时缓存
    var PREFETCH_CACHE_KEY = 'yqh_prefetch_cache';

    function getCache(cacheKey) {
        try {
            var cached = localStorage.getItem(cacheKey);
            if (!cached) return null;
            var cacheData = JSON.parse(cached);
            if (!cacheData || !cacheData.data || !cacheData.timestamp) return null;
            if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) return null;
            return cacheData.data;
        } catch(e) { return null; }
    }

    function setCache(cacheKey, data) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: data,
                timestamp: Date.now()
            }));
        } catch(e) {}
    }

    // 检查缓存是否过期
    function isCacheExpired(cacheKey) {
        try {
            var cached = localStorage.getItem(cacheKey);
            if (!cached) return true;
            var cacheData = JSON.parse(cached);
            if (!cacheData || !cacheData.timestamp) return true;
            return Date.now() - cacheData.timestamp > CACHE_EXPIRY;
        } catch(e) { return true; }
    }

    // 获取缓存时间戳
    function getCacheTimestamp(cacheKey) {
        try {
            var cached = localStorage.getItem(cacheKey);
            if (!cached) return 0;
            var cacheData = JSON.parse(cached);
            return cacheData && cacheData.timestamp ? cacheData.timestamp : 0;
        } catch(e) { return 0; }
    }

    function clearListingsCache() {
        localStorage.removeItem(LISTINGS_CACHE_KEY);
        localStorage.removeItem(PREFETCH_CACHE_KEY);
    }

    function clearRequestsCache() {
        localStorage.removeItem(REQUESTS_CACHE_KEY);
    }

    // 暴露缓存清理函数
    window.clearListingsCache = clearListingsCache;
    window.clearRequestsCache = clearRequestsCache;
    window.isListingsCacheExpired = function() { return isCacheExpired(LISTINGS_CACHE_KEY); };
    window.getListingsCacheTimestamp = function() { return getCacheTimestamp(LISTINGS_CACHE_KEY); };

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 暴露 hashPassword 和 verifyPassword 到全局
    window.hashPassword = async function(password) {
        var msgBytes = new TextEncoder().encode(password + 'yqh_salt_2024');
        var hashBuffer = await crypto.subtle.digest('SHA-256', msgBytes);
        var hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    };
    
    window.verifyPassword = async function(password, hash) {
        var newHash = await hashPassword(password);
        return newHash === hash;
    };
    
    function init() {
        console.log('初始化登录系统...');
        createAuthModal();
        setupAllLoginButtons();
    }
    
    function createAuthModal() {
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
                        '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">手机号码</label><input type="tel" id="reg-phone" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请输入11位手机号码" required pattern="1[3-9]\\d{9}"></div>' +
                        '<div style="margin-bottom:1rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">密码</label><input type="password" id="reg-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请设置登录密码（6-20个字符）" required minlength="6"></div>' +
                        '<div style="margin-bottom:1.5rem;"><label style="display:block;margin-bottom:5px;font-weight:600;color:#555;">确认密码</label><input type="password" id="reg-confirm-password" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;box-sizing:border-box;font-size:1rem;" placeholder="请再次输入密码" required></div>' +
                        '<button type="submit" style="width:100%;padding:14px;background:#4F46E5;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:600;">注 册</button>' +
                    '</form>' +
                    '<p style="text-align:center;margin-top:1rem;color:#666;">已有账号？<a href="#" onclick="showLogin();return false;" style="color:#4F46E5;text-decoration:none;font-weight:600;">立即登录</a></p>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(modal);
    }
    
    window.showAuthModal = function() {
        var modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'flex';
    };

    window.showLoginModal = window.showAuthModal;

    window.closeAuthModal = function() {
        var modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
    };
    
    window.showLogin = function() {
        document.getElementById('login-form-content').style.display = 'block';
        document.getElementById('register-form-content').style.display = 'none';
        document.getElementById('auth-title').textContent = '用户登录';
    };
    
    window.showRegister = function() {
        document.getElementById('login-form-content').style.display = 'none';
        document.getElementById('register-form-content').style.display = 'block';
        document.getElementById('auth-title').textContent = '用户注册';
    };
    
    window.handleLogin = async function(e) {
        e.preventDefault();
        var username = document.getElementById('login-username').value.trim();
        var password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            alert('请填写用户名和密码');
            return false;
        }
        
        var users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
        var user = users.find(function(u) { return u.username === username || u.phone === username; });
        
        if (user) {
            if (user.password.length === 64) {
                try {
                    if (await verifyPassword(password, user.password)) {
                        localStorage.setItem('yqh_user', JSON.stringify(user));
                        alert('登录成功');
                        window.location.reload();
                        return false;
                    }
                } catch (e) {
                    console.error('密码验证异常', e);
                }
            } else if (user.password === password) {
                var hashed = await hashPassword(password);
                user.password = hashed;
                localStorage.setItem('yqh_users', JSON.stringify(users));
                localStorage.setItem('yqh_user', JSON.stringify(user));
                alert('登录成功');
                window.location.reload();
                return false;
            }
        }
        
        try {
            var cloudResponse = await fetch(APP_CONFIG.getApiUrl('users?select=*&or=(username.eq.' + encodeURIComponent(username) + ',phone.eq.' + encodeURIComponent(username) + ')'), {
                headers: APP_CONFIG.getApiHeaders()
            });
            
            if (cloudResponse.ok) {
                var cloudUsers = await cloudResponse.json();
                if (cloudUsers && cloudUsers.length > 0) {
                    var cloudUser = cloudUsers[0];
                    if (cloudUser.password && cloudUser.password.length === 64) {
                        if (await verifyPassword(password, cloudUser.password)) {
                            users.push(cloudUser);
                            localStorage.setItem('yqh_users', JSON.stringify(users));
                            localStorage.setItem('yqh_user', JSON.stringify(cloudUser));
                            alert('登录成功');
                            window.location.reload();
                            return false;
                        }
                    } else if (cloudUser.password === password) {
                        var hashed = await hashPassword(password);
                        cloudUser.password = hashed;
                        var existingIndex = users.findIndex(function(u) { return u.id === cloudUser.id; });
                        if (existingIndex >= 0) {
                            users[existingIndex] = cloudUser;
                        } else {
                            users.push(cloudUser);
                        }
                        localStorage.setItem('yqh_users', JSON.stringify(users));
                        localStorage.setItem('yqh_user', JSON.stringify(cloudUser));
                        alert('登录成功');
                        window.location.reload();
                        return false;
                    }
                }
            }
        } catch (cloudError) {
            console.error('云端验证失败', cloudError);
        }
        
        alert('用户名或密码错误');
        return false;
    };
    
    window.handleRegister = async function(e) {
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
        
        var hashedPassword = await hashPassword(password);
        
        var newUser = {
            id: 'usr_' + Date.now(),
            username: username,
            phone: phone,
            password: hashedPassword,
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('yqh_users', JSON.stringify(users));
        localStorage.setItem('yqh_user', JSON.stringify(newUser));
        
        fetch(APP_CONFIG.getApiUrl('users'), {
            method: 'POST',
            headers: APP_CONFIG.getApiHeaders(),
            body: JSON.stringify(newUser)
        }).catch(function(e) { console.error('保存到云端失败', e); });
        
        alert('注册成功');
        window.location.reload();
        return false;
    };
    
    function setupAllLoginButtons() {
        // 所有登录按钮
        var buttons = document.querySelectorAll('[onclick*="showLoginModal"], [onclick*="showAuthModal"], .auth-btn, [data-login]');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showAuthModal();
            });
        });
    }

    // 最小字段列表 - 列表页和详情页都需要
    var LIST_MINIMAL_FIELDS = 'id,title,region,area,price,images,status,created_at,contact,description,type,height,fire_rating,tags';

    // 后台静默更新标志
    var isBackgroundRefreshing = false;

    // 数据获取函数 - 极致优化版
    // options: { useCache, forceRefresh, silentUpdate, onCacheHit, onUpdate }
    window.getApprovedListings = function(options) {
        options = options || {};
        var useCache = options.useCache !== false;
        var forceRefresh = options.forceRefresh === true;
        var silentUpdate = options.silentUpdate !== false;

        // 1. 先返回缓存（立即响应）
        if (useCache && !forceRefresh) {
            var cached = getCache(LISTINGS_CACHE_KEY);
            if (cached && Array.isArray(cached)) {
                // 异步触发后台更新
                if (silentUpdate && !isBackgroundRefreshing) {
                    silentBackgroundUpdate(options.onUpdate);
                }
                return Promise.resolve(cached);
            }
        }

        // 2. 没有缓存，发起真实请求
        isBackgroundRefreshing = true;
        return fetch(APP_CONFIG.getApiUrl('properties?select=' + LIST_MINIMAL_FIELDS + '&status=eq.approved&order=created_at.desc'), {
            headers: APP_CONFIG.getApiHeaders()
        })
        .then(function(response) { return response.json(); })
        .then(function(dbListings) {
            var result = dbListings || [];
            isBackgroundRefreshing = false;
            if (useCache && result.length > 0) {
                setCache(LISTINGS_CACHE_KEY, result);
            }
            if (options.onUpdate) options.onUpdate(result);
            return result;
        })
        .catch(function(error) {
            isBackgroundRefreshing = false;
            console.error('获取云端数据失败', error);
            var cached = getCache(LISTINGS_CACHE_KEY);
            return cached || [];
        });
    };

    // 后台静默更新（不阻塞主线程）
    function silentBackgroundUpdate(callback) {
        if (isCacheExpired(LISTINGS_CACHE_KEY)) {
            fetch(APP_CONFIG.getApiUrl('properties?select=' + LIST_MINIMAL_FIELDS + '&status=eq.approved&order=created_at.desc'), {
                headers: APP_CONFIG.getApiHeaders()
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data && Array.isArray(data) && data.length > 0) {
                    setCache(LISTINGS_CACHE_KEY, data);
                    if (callback) callback(data);
                }
            })
            .catch(function() {});
        }
    }

    // 获取单条房源详情
    window.getListingById = function(id) {
        if (!id) return Promise.resolve(null);
        var cached = getCache(LISTINGS_CACHE_KEY);
        if (cached && Array.isArray(cached)) {
            var found = cached.find(function(l) { return l.id == id; });
            if (found) return Promise.resolve(found);
        }
        return fetch(APP_CONFIG.getApiUrl('properties?id=eq.' + id + '&select=*'), {
            headers: APP_CONFIG.getApiHeaders()
        })
        .then(function(response) { return response.json(); })
        .then(function(data) { return data && data.length > 0 ? data[0] : null; })
        .catch(function(error) { return null; });
    };

    // 预加载下一页数据
    window.prefetchNextPage = function(currentPage, pageSize) {
        var nextPage = currentPage + 1;
        var offset = (nextPage - 1) * pageSize;
        var url = APP_CONFIG.getApiUrl('properties?select=' + LIST_MINIMAL_FIELDS + '&status=eq.approved&order=created_at.desc&limit=' + pageSize + '&offset=' + offset);
        return fetch(url, { headers: APP_CONFIG.getApiHeaders() })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data && Array.isArray(data)) {
                setCache(PREFETCH_CACHE_KEY + '_' + nextPage, data);
            }
            return data || [];
        })
        .catch(function() { return []; });
    };

    // 获取预加载的下一页数据
    window.getPrefetchedPage = function(page) {
        try {
            var cached = localStorage.getItem(PREFETCH_CACHE_KEY + '_' + page);
            if (cached) {
                var data = JSON.parse(cached);
                if (data && data.data) return Promise.resolve(data.data);
            }
        } catch(e) {}
        return Promise.resolve([]);
    };

    // 分页获取房源数据 - 优化版本
    window.getListingsPaginated = function(fields, page, pageSize) {
        // 先检查预加载缓存
        var prefetched = window.getPrefetchedPage(page);
        if (prefetched && prefetched.length > 0) {
            return Promise.resolve(prefetched);
        }

        var offset = (page - 1) * pageSize;
        var selectFields = LIST_MINIMAL_FIELDS;
        if (fields && fields !== '*') {
            var requestedFields = fields.split(',');
            var minimalFields = LIST_MINIMAL_FIELDS.split(',');
            var merged = {};
            requestedFields.forEach(function(f) {
                if (minimalFields.indexOf(f) >= 0 || f === 'id') {
                    merged[f] = true;
                }
            });
            selectFields = Object.keys(merged).join(',');
        }
        var url = APP_CONFIG.getApiUrl('properties?select=' + selectFields + '&status=eq.approved&order=created_at.desc&limit=' + pageSize + '&offset=' + offset);
        return fetch(url, {
            headers: APP_CONFIG.getApiHeaders()
        })
        .then(function(response) { return response.json(); })
        .then(function(data) { return data || []; })
        .catch(function(error) {
            console.error('获取云端数据失败:', error);
            return [];
        });
    };

    // 获取总数 - 优化版，使用缓存
    window.getListingsCount = function() {
        var cached = getCache(LISTINGS_CACHE_KEY);
        if (cached && Array.isArray(cached)) {
            return Promise.resolve(cached.length);
        }
        return fetch(APP_CONFIG.getApiUrl('properties?status=eq.approved&select=id'), {
            headers: APP_CONFIG.getApiHeaders()
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            return data ? data.length : 0;
        })
        .catch(function(error) {
            console.error('获取总数失败', error);
            return 0;
        });
    };

    window.formatPrice = function(price) {
        if (!price) return '面议';
        if (price === '0') return '面议';
        return price.toLocaleString('zh-CN');
    };
    
    window.escapeHtml = function(value) {
        if (!value) return '';
        var div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    };
    
    window.getUrlParam = function(name) {
        var url = new URL(window.location.href);
        return url.searchParams.get(name) || '';
    };

    // 获取求租信息 - 带缓存
    window.getApprovedRequests = function(options) {
        options = options || {};
        var useCache = options.useCache !== false;
        var forceRefresh = options.forceRefresh === true;

        if (useCache && !forceRefresh) {
            var cached = getCache(REQUESTS_CACHE_KEY);
            if (cached && Array.isArray(cached)) {
                return Promise.resolve(cached);
            }
        }

        return fetch(APP_CONFIG.getApiUrl('requests?select=*&status=eq.approved&order=created_at.desc'), {
            headers: APP_CONFIG.getApiHeaders()
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            var result = data || [];
            if (useCache && result.length > 0) {
                setCache(REQUESTS_CACHE_KEY, result);
            }
            return result;
        })
        .catch(function(error) {
            console.error('获取求租信息失败', error);
            var cached = getCache(REQUESTS_CACHE_KEY);
            return cached || [];
        });
    };
})();
