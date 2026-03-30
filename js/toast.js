/**
 * 园企汇 - Toast 提示组件
 * 用法: toast.show('提示内容', 'success'|'error'|'info', 3000)
 * 同时拦截 window.alert 并自动转为 toast
 */
(function() {
    // ========== 调试开关 ==========
    // 设置为 false 可禁用所有 console 输出（生产环境建议）
    var DEBUG_MODE = false;

    // 拦截 console 输出
    if (!DEBUG_MODE) {
        ['log', 'error', 'warn', 'info'].forEach(function(method) {
            var original = console[method];
            console[method] = function() {
                // 只保留关键错误，其他静默
                if (method === 'error' && arguments[0] && arguments[0].indexOf && arguments[0].indexOf('未加载') >= 0) {
                    original.apply(console, arguments);
                }
            };
        });
    }

    var toastContainer = null;

    // 创建 Toast 容器
    function createToastContainer() {
        if (toastContainer) return toastContainer;
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(toastContainer);
        return toastContainer;
    }

    // 显示 Toast
    function show(message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;

        var container = createToastContainer();

        var toast = document.createElement('div');
        toast.style.cssText = 'padding:12px 24px;border-radius:8px;font-size:14px;pointer-events:auto;box-shadow:0 4px 12px rgba(0,0,0,0.15);transform:translateX(100%);opacity:0;transition:all 0.3s ease;max-width:320px;';

        var colors = {
            success: { bg: '#10b981', text: '#fff' },
            error: { bg: '#ef4444', text: '#fff' },
            info: { bg: '#3b82f6', text: '#fff' },
            warning: { bg: '#f59e0b', text: '#fff' }
        };
        var color = colors[type] || colors.info;

        toast.style.backgroundColor = color.bg;
        toast.style.color = color.text;

        var icons = {
            success: '<i class="fas fa-check-circle" style="margin-right:8px"></i>',
            error: '<i class="fas fa-times-circle" style="margin-right:8px"></i>',
            info: '<i class="fas fa-info-circle" style="margin-right:8px"></i>',
            warning: '<i class="fas fa-exclamation-circle" style="margin-right:8px"></i>'
        };

        toast.innerHTML = (icons[type] || icons.info) + escapeHtml(message);

        container.appendChild(toast);

        requestAnimationFrame(function() {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(function() {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toast API
    window.toast = {
        show: show,
        success: function(msg, duration) { show(msg, 'success', duration); },
        error: function(msg, duration) { show(msg, 'error', duration); },
        info: function(msg, duration) { show(msg, 'info', duration); },
        warning: function(msg, duration) { show(msg, 'warning', duration); }
    };

    // 拦截 window.alert，自动转为 toast
    var originalAlert = window.alert;
    window.alert = function(message) {
        if (typeof toast !== 'undefined') {
            toast.show(String(message), 'info', 3000);
        } else {
            originalAlert(message);
        }
    };

    // 挂载完成后自动执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Toast 提示组件已加载，alert 已被拦截');
        });
    } else {
        console.log('Toast 提示组件已加载，alert 已被拦截');
    }
})();
