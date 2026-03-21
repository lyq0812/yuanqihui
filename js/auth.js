var currentUser = null;

// Supabase配置
const SUPABASE_URL = 'https://tysrmpssxrdjgrubkltj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc';

function getSupabase() {
    return {
        from: function(table) {
            return {
                select: function(columns) {
                    return {
                        then: function(resolve, reject) {
                            fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=' + columns, {
                                headers: {
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': 'Bearer ' + SUPABASE_KEY
                                }
                            }).then(r => {
                                if (!r.ok) {
                                    r.text().then(t => console.error('Select error:', r.status, t));
                                }
                                return r.json();
                            }).then(data => resolve({data: data, error: null})).catch(err => resolve({data: [], error: err}));
                        }
                    };
                },
                insert: function(data) {
                    return {
                        then: function(resolve, reject) {
                            fetch(SUPABASE_URL + '/rest/v1/' + table, {
                                method: 'POST',
                                headers: {
                                    'apikey': SUPABASE_KEY,
                                    'Authorization': 'Bearer ' + SUPABASE_KEY,
                                    'Content-Type': 'application/json',
                                    'Prefer': 'return=representation'
                                },
                                body: JSON.stringify(data)
                            }).then(r => {
                                if (!r.ok) {
                                    r.text().then(t => {
                                        console.error('Insert error:', r.status, t);
                                        alert('注册失败: ' + t);
                                    });
                                }
                                return r.json();
                            }).then(data => resolve({data: data, error: null})).catch(err => {
                                console.error('Insert catch:', err);
                                resolve({data: [], error: err});
                            });
                        }
                    };
                },
                update: function(data) {
                    return {
                        eq: function(field, value) {
                            return {
                                then: function(resolve) {
                                    fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + field + '.eq.' + value, {
                                        method: 'PATCH',
                                        headers: {
                                            'apikey': SUPABASE_KEY,
                                            'Authorization': 'Bearer ' + SUPABASE_KEY,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(data)
                                    }).then(r => r.json()).then(data => resolve({data: data, error: null}));
                                }
                            };
                        }
                    };
                }
            };
        }
    };
}

function initAuth() {
    var savedUser = localStorage.getItem('yqh_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateNavForAuth();
        } catch(e) {
            console.log('解析用户数据失败', e);
        }
    }
}

function showAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeAuthModal() {
    var modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function doLogin() {
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    var users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    var user = users.find(function(u) { return u.username === username && u.password === password; });
    
    if (user) {
        localStorage.setItem('yqh_user', JSON.stringify(user));
        currentUser = user;
        updateNavForAuth();
        closeAuthModal();
    } else {
        // 尝试从云端验证
        getSupabase().from('users').select('*').then(function(result) {
            var cloudUser = result.data.find(function(u) { return u.username === username && u.password === password; });
            if (cloudUser) {
                localStorage.setItem('yqh_user', JSON.stringify(cloudUser));
                currentUser = cloudUser;
                updateNavForAuth();
                closeAuthModal();
                
                // 保存到本地
                var localUsers = JSON.parse(localStorage.getItem('yqh_users') || '[]');
                if (!localUsers.find(function(u) { return u.username === username; })) {
                    localUsers.push(cloudUser);
                    localStorage.setItem('yqh_users', JSON.stringify(localUsers));
                }
            } else {
                alert('用户名或密码错误');
            }
        });
    }
}

function doRegister() {
    var username = document.getElementById('reg-username').value.trim();
    var phone = document.getElementById('reg-phone').value.trim();
    var password = document.getElementById('reg-password').value;
    var confirmPassword = document.getElementById('reg-confirm-password').value;
    
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
    
    var users = JSON.parse(localStorage.getItem('yqh_users') || '[]');
    var existingUser = users.find(function(u) { return u.username === username || u.phone === phone; });
    if (existingUser) {
        alert('用户名或手机号已被注册');
        return;
    }
    
    var newUser = {
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
    console.log('正在注册到云端:', newUser);
    getSupabase().from('users').insert([newUser]).then(function(result) {
        console.log('注册结果:', result);
        if (result.error) {
            alert('云端注册失败: ' + result.error);
        } else {
            alert('注册成功！');
        }
    });
    
    updateNavForAuth();
    closeAuthModal();
}

function doLogout() {
    localStorage.removeItem('yqh_user');
    currentUser = null;
    updateNavForAuth();
    window.location.reload();
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

function switchToLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
}

function switchToRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}
