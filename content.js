const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const SELECTORS = {
    tiles: 'a[href*="/p/"], a[href*="/reel/"]',
    closeBtn: 'svg[aria-label="Close"], svg[aria-label="ปิด"]'
};

let running = false;
let currentActions = [];
let processedLinks = new Set();
let stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0 };

/**
 * Check if the bot should continue. Throws error to break all loops if stopped.
 */
async function checkStatus() {
    if (!running) throw new Error("BOT_STOPPED");
}

function updateUI(customMsg = "") {
    chrome.runtime.sendMessage({
        type: "STATS_UPDATE",
        stats,
        msg: customMsg,
        running
    });
}

function getSummary() {
    let summary = "Mission complete. History rewritten.";
    if (stats.success > 0) {
        const details = [];
        if (stats.posts > 0) details.push(`${stats.posts} posts`);
        if (stats.reels > 0) details.push(`${stats.reels} reels`);
        summary = `History rewritten. ${details.join(' and ')} redacted.`;
    }
    return summary;
}

// -------------------- 🖱 Humanized Interactions --------------------

async function humanClick(el) {
    if (!el) return;
    await checkStatus();
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
    const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);

    const eventInit = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1 };
    el.dispatchEvent(new MouseEvent('mousedown', eventInit));
    await sleep(rand(50, 120));
    el.dispatchEvent(new MouseEvent('mouseup', eventInit));
    el.dispatchEvent(new MouseEvent('click', eventInit));
}

async function humanScrollTo(el) {
    if (!el) return;
    await checkStatus();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(rand(600, 900));
}

// -------------------- ⚙ Action Finder --------------------
function findActionButton(action) {
    const outlets = {
        LIKE: ["Like", "Unlike", "ถูกใจ", "เลิกถูกใจ"],
        REPOST: ["Repost", "Unrepost", "รีโพสต์", "เลิกโพสต์ใหม่"],
        SAVE: ["Save", "Remove", "บันทึก", "เลิกบันทึก", "Unsave"]
    };

    const labels = outlets[action] || [];
    const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');
    const root = article || document;

    if (action === 'LIKE' || action === 'REPOST') {
        const sections = root.querySelectorAll('section');
        for (const section of sections) {
            const hasLike = section.querySelector('svg[aria-label="Like"], svg[aria-label="Unlike"], svg[aria-label="ถูกใจ"], svg[aria-label="เลิกถูกใจ"]');
            if (!hasLike) continue;

            const btns = Array.from(section.querySelectorAll('[role="button"]'));
            for (const btn of btns) {
                const svg = btn.querySelector('svg[aria-label]');
                if (svg && labels.includes(svg.getAttribute('aria-label'))) {
                    if (!btn.closest('ul') && !btn.closest('li')) return btn;
                }
            }
        }
    }

    if (action === 'SAVE') {
        for (const label of labels) {
            const svg = root.querySelector(`svg[aria-label="${label}"]`);
            if (svg) {
                const btn = svg.closest('[role="button"]');
                if (btn && !btn.closest('ul') && !btn.closest('li')) return btn;
            }
        }
    }
    return null;
}

function getOwnerName() {
    const article = document.querySelector('article[role="presentation"]') || document.querySelector('article');
    if (!article) return "someone";
    const userLink = article.querySelector('a[href^="/"][role="link"]');
    if (userLink) {
        const name = userLink.getAttribute('href').replace(/\//g, '');
        if (name && !['explore', 'reels'].includes(name)) return name;
    }
    return "someone";
}

// -------------------- 🔥 Core Logic --------------------

async function processOne(href) {
    await checkStatus();

    let tile = document.querySelector(`a[href="${href}"]`);
    if (!tile) {
        const shortHref = href.split('?')[0];
        tile = document.querySelector(`a[href*="${shortHref}"]`);
    }
    if (!tile) return false;

    const isReel = href.includes('/reel/');
    const type = isReel ? "reel" : "post";

    await humanScrollTo(tile);
    updateUI(`Intercepting memory...`);
    
    await humanClick(tile);
    await sleep(rand(1000, 1800));

    const owner = getOwnerName();
    updateUI(`Analyzing @${owner}'s trace`);

    let anySuccess = false;
    for (const action of currentActions) {
        await checkStatus();
        let btn = null;
        for (let i = 0; i < 15; i++) {
            await checkStatus();
            btn = findActionButton(action);
            if (btn) break;
            await sleep(200);
        }

        if (btn && running) {
            await humanClick(btn);
            anySuccess = true;
            updateUI(`Redacted interaction with @${owner}`);
            await sleep(rand(400, 800));
        }
    }

    if (anySuccess) {
        stats.success++;
        if (isReel) stats.reels++; else stats.posts++;
    } else {
        stats.fail++;
    }

    const close = document.querySelector(SELECTORS.closeBtn);
    if (close) await humanClick(close);
    else window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape' }));

    stats.done++;
    processedLinks.add(href);
    updateUI();

    await sleep(rand(1200, 2200));
}

async function startWorkflow(actions) {
    if (running) return;
    running = true;
    currentActions = actions;
    processedLinks.clear();
    stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0 };
    
    updateUI("Initiating redaction protocol...");

    try {
        while (running) {
            await checkStatus();

            const tiles = Array.from(document.querySelectorAll(SELECTORS.tiles));
            const uniqueHrefs = [...new Set(tiles.map(t => t.getAttribute('href')))];
            const newHrefs = uniqueHrefs.filter(href => href && !processedLinks.has(href));

            if (newHrefs.length > 0) {
                for (const href of newHrefs) {
                    await checkStatus();
                    await processOne(href);
                }
            } else {
                updateUI("Searching for more traces...");
                const lastHeight = document.documentElement.scrollHeight;
                window.scrollBy({ top: rand(1000, 1500), behavior: 'smooth' });
                await sleep(rand(2000, 3000)); 
                if (document.documentElement.scrollHeight === lastHeight) break;
            }
        }
    } catch (e) {
        console.log("Doomscroll Bot stopped.");
    } finally {
        const wasRunning = running;
        running = false;
        chrome.runtime.sendMessage({ type: "WORKFLOW_COMPLETE", summary: getSummary() });
    }
}

// -------------------- 🛑 Listeners --------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
        sendResponse({ running, stats, currentAction: currentActions });
        return;
    }
    if (msg.type === "START") {
        if (!running) startWorkflow(msg.actions);
        sendResponse({ status: "ok" });
    }
    if (msg.type === "STOP") {
        running = false;
        sendResponse({ status: "ok", summary: getSummary() });
    }
    if (msg.type === "UPDATE_CONFIG") {
        currentActions = msg.actions || currentActions;
        sendResponse({ status: "ok" });
    }
    return true; 
});
