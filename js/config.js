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
                // 本地开发：使用 Vercel 本地服务器或 Supabase 作为后备
                return 'https://yuanqihui.icu'; // 部署后替换为你的域名
            } else {
                // 生产环境：使用当前域名
                return window.location.origin;
            }
        }
        return '';
    },

    // 获取完整API URL
    getApiUrl: function(endpoint, method) {
        // 始终走 Vercel Serverless Functions
        return this.getApiBase() + '/api/' + endpoint;
    },

    // API请求头
    getApiHeaders: function() {
        return {
            'Content-Type': 'application/json'
        };
    }
};
