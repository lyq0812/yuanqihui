/**
 * 园企汇 - 配置文件
 *
 * 注意：此文件中的API密钥是前端公开的匿名密钥（anon key）
 * 安全性通过Supabase的RLS（行级安全策略）来实现
 * 不要在此处放置service_role密钥！
 */
window.APP_CONFIG = {
    // Supabase配置
    SUPABASE_URL: 'https://tysrmpssxrdjgrubkltj.supabase.co',

    // 匿名密钥（公共只读/写入密钥）- 仅用于前端
    // 此密钥受RLS策略保护，限制了对敏感数据的访问
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5c3JtcHNzeHJkamdydWJrbHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzUxNzAsImV4cCI6MjA4OTY1MTE3MH0.jMnnFGpwzdrd8caQlyMoSvmlOTNJYPjvLUq1l86zqOc',

    // API请求头
    getApiHeaders: function() {
        return {
            'apikey': this.SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + this.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    // 获取完整API URL - 优先使用Vercel Edge API
    getApiUrl: function(endpoint) {
        // 检测是否在浏览器环境
        if (typeof window !== 'undefined') {
            // 获取当前域名，自动判断是否使用Edge API
            var currentHost = window.location.hostname;
            var isVercel = currentHost.includes('vercel.app') || currentHost === 'yuanqihui.icu' || currentHost === 'www.yuanqihui.icu';

            // 如果部署在Vercel，使用Edge API
            if (isVercel) {
                // 解析endpoint参数
                var parts = endpoint.split('?');
                var base = parts[0];
                var query = parts.length > 1 ? parts[1] : '';

                // 解析query string
                var params = {};
                if (query) {
                    query.split('&').forEach(function(pair) {
                        var kv = pair.split('=');
                        if (kv.length >= 1) {
                            params[decodeURIComponent(kv[0])] = kv.length > 1 ? decodeURIComponent(kv[1]) : '';
                        }
                    });
                }

                // properties 映射到 Edge API
                if (base.indexOf('properties') === 0) {
                    var edgeParams = [];
                    // 分页参数
                    if (params.limit) {
                        edgeParams.push('pageSize=' + params.limit);
                        delete params.limit;
                    }
                    if (params.offset) {
                        var page = Math.floor(params.offset / (params.limit || 10)) + 1;
                        edgeParams.push('page=' + page);
                        delete params.offset;
                    }
                    // 地区筛选
                    if (params.region && params.region.indexOf('eq.') === 0) {
                        edgeParams.push('region=' + params.region.replace('eq.', ''));
                        delete params.region;
                    }
                    // 其他参数透传
                    for (var key in params) {
                        if (params.hasOwnProperty(key)) {
                            edgeParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                        }
                    }
                    return '/api/listings' + (edgeParams.length > 0 ? '?' + edgeParams.join('&') : '');
                }

                // requests 映射到 Edge API
                if (base.indexOf('requests') === 0) {
                    var edgeParams = [];
                    if (params.limit) {
                        edgeParams.push('pageSize=' + params.limit);
                        delete params.limit;
                    }
                    if (params.offset) {
                        var page = Math.floor(params.offset / (params.limit || 10)) + 1;
                        edgeParams.push('page=' + page);
                        delete params.offset;
                    }
                    for (var key in params) {
                        if (params.hasOwnProperty(key)) {
                            edgeParams.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                        }
                    }
                    return '/api/requests' + (edgeParams.length > 0 ? '?' + edgeParams.join('&') : '');
                }
            }
        }
        // 默认使用Supabase直接调用
        return this.SUPABASE_URL + '/rest/v1/' + endpoint;
    }
};
