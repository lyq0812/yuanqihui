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

    // 获取完整API URL
    // 注意：为了避免 Vercel Edge 缓存问题，所有请求都直接走 Supabase
    // Vercel Edge 缓存会导致数据不一致
    getApiUrl: function(endpoint, method) {
        // 所有请求都直接走 Supabase，避免 Vercel Edge 缓存问题
        return this.SUPABASE_URL + '/rest/v1/' + endpoint;
    }
};
