/**
 * Web Automation Engine v1.1.0 - Utility Suite
 */

window.waeUtils = {
    logs: [], // Store logs here instead of direct console output
    
    log: (component, message, type = 'info') => {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            component: component,
            message: message,
            type: type
        };
        window.waeUtils.logs.push(entry);
        
        // Keep only last 200 logs to prevent memory leak
        if (window.waeUtils.logs.length > 200) window.waeUtils.logs.shift();
    },

    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    rand: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,

    waitForSelector: async (selector, timeout = 10000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el) return el;
            await new Promise(r => requestAnimationFrame(r));
        }
        return null;
    },

    humanClick: async (el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = rect.left + rect.width * (0.2 + Math.random() * 0.6);
        const y = rect.top + rect.height * (0.2 + Math.random() * 0.6);
        const eventInit = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1 };
        el.dispatchEvent(new MouseEvent('pointerdown', eventInit));
        el.dispatchEvent(new MouseEvent('mousedown', eventInit));
        await window.waeUtils.sleep(window.waeUtils.rand(60, 150));
        el.dispatchEvent(new MouseEvent('pointerup', eventInit));
        el.dispatchEvent(new MouseEvent('mouseup', eventInit));
        el.dispatchEvent(new MouseEvent('click', eventInit));
    },

    humanScrollTo: async (el) => {
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await window.waeUtils.sleep(window.waeUtils.rand(800, 1200));
    },

    simulateTyping: async (el, text) => {
        if (!el) return;
        el.focus();
        for (const char of text) {
            await window.waeUtils.sleep(window.waeUtils.rand(50, 200));
            el.value += char;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
    },

    isSupportedPage: (patterns = []) => {
        const currentPath = window.location.pathname;
        if (patterns.length === 0) {
            const reserved = ['/reels/', '/direct/', '/accounts/'];
            return !reserved.some(p => currentPath.startsWith(p));
        }
        return patterns.some(pattern => {
            if (pattern instanceof RegExp) return pattern.test(currentPath);
            return currentPath.includes(pattern);
        });
    },

    downloadJSON: (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

window.sleep = window.waeUtils.sleep;
window.rand = window.waeUtils.rand;
