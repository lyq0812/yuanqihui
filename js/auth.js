// 园企汇 - 统一登录系统 v6.0

(function() {
    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
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
    
    window.handleLogin = function(e) {
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
            localStorage.setItem('yqh_user', JSON.stringify(user));
            alert('登录成功');
            window.location.reload();
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
                localStorage.setItem('yqh_user', JSON.stringify(user));
                alert('登录成功');
                window.location.reload();
            } else {
                alert('用户名或密码错误');
            }
        })
        .catch(function(error) {
            console.error('登录失败', error);
            alert('用户名或密码错误');
        });
        
        return false;
    };
    
    window.handleRegister = function(e) {
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
    
    // 数据获取函数
    window.getApprovedListings = function() {
        return fetch('https://tysrmpssxrdjgrubkltj.supabase.co/rest/v1/properties?select=*', {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc'
            }
        })
        .then(function(response) { return response.json(); })
        .then(function(dbListings) {
            var localListings = JSON.parse(localStorage.getItem('yqh_listings') || '[]');
            var allListings = [].concat(dbListings);
            localListings.forEach(function(local) {
                if (!allListings.find(function(l) { return l.id === local.id; })) {
                    allListings.push(local);
                }
            });
            return allListings;
        })
        .catch(function(error) {
            console.error('获取云端数据失败', error);
            return JSON.parse(localStorage.getItem('yqh_listings') || '[]');
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
})();
