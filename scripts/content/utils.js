const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function isSupportedPage() {
    const path = window.location.pathname;
    const isHome = path === '/' || path === '';
    const isExplore = path.startsWith('/explore');
    const isSaved = path.includes('/saved/');
    const reservedPaths = ['/reels/', '/direct/', '/accounts/', '/emails/', '/legal/', '/privacy/'];
    const isReserved = reservedPaths.some(p => path.startsWith(p));
    return isExplore || (!isHome && !isReserved) || isSaved;
}

async function humanClick(el, running) {
    if (!el || !running) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);
    const eventInit = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1 };
    el.dispatchEvent(new MouseEvent('mousedown', eventInit));
    await sleep(rand(50, 120));
    el.dispatchEvent(new MouseEvent('mouseup', eventInit));
    el.dispatchEvent(new MouseEvent('click', eventInit));
}

async function humanScrollTo(el, running) {
    if (!el || !running) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(rand(600, 900));
}
