const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const SELECTORS = {
  tiles: 'a[href*="/p/"], a[href*="/reel/"]',
  closeBtn: 'svg[aria-label="Close"], svg[aria-label="ปิด"]'
};

let running = false;
let paused = false;
let currentActions = ['LIKE'];
let actionLimit = 9999; 

let stats = {
  done: 0,
  success: 0,
  posts: 0,
  reels: 0,
  fail: 0,
  limit: 9999
};

let processedLinks = new Set();

// -------------------- 📡 Communication --------------------
function updateUI(customMsg = "") {
  chrome.runtime.sendMessage({
    type: "STATS_UPDATE",
    stats,
    msg: customMsg
  });
}

// -------------------- 🖱 Human Interaction Logic --------------------

async function humanClick(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
  const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);

  const eventInit = {
    bubbles: true, cancelable: true, view: window,
    clientX: x, clientY: y, buttons: 1
  };

  el.dispatchEvent(new MouseEvent('mousedown', eventInit));
  await sleep(rand(30, 80));
  el.dispatchEvent(new MouseEvent('mouseup', eventInit));
  el.dispatchEvent(new MouseEvent('click', eventInit));
}

async function humanScrollTo(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(rand(400, 700));
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
      const hasLikeBtn = section.querySelector('svg[aria-label="Like"], svg[aria-label="Unlike"], svg[aria-label="ถูกใจ"], svg[aria-label="เลิกถูกใจ"]');
      if (!hasLikeBtn) continue;

      const buttons = Array.from(section.querySelectorAll('[role="button"]'));
      for (const btn of buttons) {
        const svg = btn.querySelector('svg[aria-label]');
        if (svg && labels.includes(svg.getAttribute('aria-label'))) {
          if (btn.closest('ul') || btn.closest('li')) continue;
          return btn;
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
        if (name && name !== 'explore' && name !== 'reels') return name;
    }
    return "someone";
}

// -------------------- 🔥 Core Logic: Process One --------------------
async function processOne(href) {
  if (!running) return false;
  while (paused) { if (!running) return false; await sleep(500); }

  let tile = document.querySelector(`a[href="${href}"]`);
  if (!tile) {
      const shortHref = href.split('?')[0];
      tile = document.querySelector(`a[href*="${shortHref}"]`);
  }
  if (!tile) return false;

  const isReel = href.includes('/reel/');
  const type = isReel ? "reel" : "post";

  await humanScrollTo(tile);
  const intros = ["Targeting history...", "Intercepting memory...", "Locating digital footprint...", "Rewriting this moment..."];
  updateUI(intros[rand(0, intros.length - 1)]);
  
  await humanClick(tile);
  await sleep(rand(800, 1500));

  const owner = getOwnerName();
  const viewing = [`Analyzing @${owner}'s trace`, `Scanning @${owner}'s ${type}`, `Assessing @${owner}`, `Evaluating interaction with @${owner}`];
  updateUI(viewing[rand(0, viewing.length - 1)]);

  let anySuccess = false;
  
  for (const action of currentActions) {
      while (paused) { if (!running) return false; await sleep(500); }

      let btn = null;
      for (let i = 0; i < 10; i++) {
          await sleep(200);
          btn = findActionButton(action);
          if (btn) break;
      }

      if (btn) {
        await humanClick(btn);
        anySuccess = true;
        
        const rewriteMsgs = [
            `Erased trace from @${owner}`,
            `Redacted interaction with @${owner}`,
            `Successfully cleared @${owner}`,
            `@${owner}'s history has been rewritten`
        ];
        updateUI(rewriteMsgs[rand(0, rewriteMsgs.length - 1)]);
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

  await sleep(rand(1000, 2000));
  return true;
}

// -------------------- 🚀 Main Workflow --------------------
async function startWorkflow(actions, limit) {
  running = true;
  paused = false;
  currentActions = actions;
  actionLimit = limit;
  
  stats = { done: 0, success: 0, posts: 0, reels: 0, fail: 0, limit: actionLimit };
  processedLinks.clear();
  
  const startMsgs = ["Initiating redaction protocol...", "Entering the ghost layer...", "Preparing to rewrite history...", "Starting traceless session..."];
  updateUI(startMsgs[rand(0, startMsgs.length - 1)]);

  while (running) {
    if (paused) { await sleep(500); continue; }

    const tiles = Array.from(document.querySelectorAll(SELECTORS.tiles));
    const uniqueHrefs = [...new Set(tiles.map(t => t.getAttribute('href')))];
    const newHrefs = uniqueHrefs.filter(href => href && !processedLinks.has(href));

    if (newHrefs.length > 0) {
      for (const href of newHrefs) {
        if (!running) break;
        while (paused) { if (!running) break; await sleep(500); }
        await processOne(href);
      }
    } else {
      const nextMsgs = ["Scrolling deeper...", "Accessing further history...", "Searching for more traces...", "Extending the search..."];
      updateUI(nextMsgs[rand(0, nextMsgs.length - 1)]);
      
      const lastHeight = document.documentElement.scrollHeight;
      window.scrollBy({ top: rand(1000, 1500), behavior: 'smooth' });
      await sleep(rand(1500, 2500)); 
      if (document.documentElement.scrollHeight === lastHeight) break;
    }
  }

  running = false;
  
  // Construct summary message
  let summary = "Mission complete. Trace cleared.";
  if (stats.success > 0) {
      const details = [];
      if (stats.posts > 0) details.push(`${stats.posts} posts`);
      if (stats.reels > 0) details.push(`${stats.reels} reels`);
      summary = `Mission complete. History rewritten for ${details.join(' and ')}.`;
  }
  
  chrome.runtime.sendMessage({ type: "WORKFLOW_COMPLETE", summary });
}

// -------------------- 🛑 Listeners --------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    sendResponse({ running, paused, stats, currentAction: currentActions });
    return;
  }
  if (msg.type === "START") {
      startWorkflow(msg.actions, msg.limit);
      sendResponse({ status: "ok" });
  }
  if (msg.type === "UPDATE_CONFIG") {
      currentActions = msg.actions || currentActions;
      updateUI();
      sendResponse({ status: "ok" });
  }
  if (msg.type === "PAUSE") { paused = true; sendResponse({ status: "ok" }); }
  if (msg.type === "RESUME") { paused = false; sendResponse({ status: "ok" }); }
  if (msg.type === "STOP") { running = false; paused = false; sendResponse({ status: "ok" }); }
  return true; 
});
