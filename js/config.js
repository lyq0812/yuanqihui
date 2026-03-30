/**
 * 园企汇 - 配置文件
 *
 * 数据库已切换到 Neon PostgreSQL
 * API 请求通过 Vercel Serverless Functions
 */
window.APP_CONFIG = {
    // 获取当前域名，自动判断 API 地址
    getApiBase: function() {
        if (typeof window !== 'undefined') {
            var currentHost = window.location.hostname;
            var isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

            if (isLocalhost) {
                return 'https://yuanqihui.icu';
            } else {
                return window.location.origin;
            }
        }
        return '';
    },

    // 获取完整API URL
    getApiUrl: function(endpoint, method) {
        return this.getApiBase() + '/api/' + endpoint;
    },

    // API请求头
    getApiHeaders: function() {
        return {
            'Content-Type': 'application/json'
        };
    }
};
