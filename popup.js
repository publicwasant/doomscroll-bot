const btnPlay = document.getElementById("btnPlay");
const btnCount = document.getElementById("btnCount");
const btnLabel = document.getElementById("btnLabel");
const statusLabel = document.getElementById("statusLabel");
const statusLabelWrap = document.getElementById("statusLabelWrap");
const actionInputs = document.querySelectorAll('input[name="action"]');

let isRunning = false;
let isPaused = false;
let lastStats = null;

// -------------------- SYNC STATE ON OPEN --------------------
async function syncState() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url || !tab.url.includes("instagram.com")) return;

  chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
    if (chrome.runtime.lastError || !res) return;

    isRunning = res.running;
    isPaused = res.paused;
    lastStats = res.stats;

    updatePlayButtonUI();
    
    const currentActions = Array.isArray(res.currentAction) ? res.currentAction : [res.currentAction];
    actionInputs.forEach(input => {
        input.checked = currentActions.includes(input.value);
    });
    
    updateStatsUI(res.stats);
  });
}

syncState();

// -------------------- HELPERS --------------------
function getSummaryText(stats) {
    if (!stats || stats.success === 0) return "No history redacted yet.";
    const details = [];
    if (stats.posts > 0) details.push(`${stats.posts} posts`);
    if (stats.reels > 0) details.push(`${stats.reels} reels`);
    return `${details.join(' and ')} redacted so far.`;
}

function updatePlayButtonUI() {
    if (!isRunning) {
        btnLabel.style.display = "block";
        btnLabel.textContent = "START";
        btnLabel.style.fontSize = "16px";
        btnCount.style.display = "none";
        btnPlay.classList.remove("is-running", "is-paused");
        statusLabelWrap.classList.remove("is-running");
        statusLabel.textContent = "System Idle";
    } else {
        if (isPaused) {
            btnLabel.style.display = "block";
            btnLabel.textContent = "RESUME";
            btnLabel.style.fontSize = "14px";
            btnCount.style.display = "none";
            btnPlay.classList.add("is-paused");
            btnPlay.classList.remove("is-running");
            statusLabelWrap.classList.remove("is-running");
            
            // Show summary during pause
            statusLabel.innerHTML = `Engine Paused. ${getSummaryText(lastStats)}`;
        } else {
            btnLabel.style.display = "none";
            btnCount.style.display = "block";
            btnPlay.classList.add("is-running");
            btnPlay.classList.remove("is-paused");
            statusLabelWrap.classList.add("is-running");
        }
    }
}

function updateStatsUI(stats, customMsg = "") {
  if (!stats) return;
  lastStats = stats;
  btnCount.textContent = stats.success || 0;
  
  if (customMsg) {
      statusLabel.textContent = customMsg;
  } else if (isRunning && !isPaused) {
      // While running, if no human talk, show simple running msg
      statusLabel.textContent = "Engine Running...";
  }
}

function resetUI() {
    isRunning = false;
    isPaused = false;
    updatePlayButtonUI();
}

function getSelectedActions() {
    return Array.from(actionInputs).filter(i => i.checked).map(i => i.value);
}

async function sendConfigUpdate() {
    if (!isRunning) return;
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab) return;
    const actions = getSelectedActions();
    chrome.tabs.sendMessage(tab.id, { type: "UPDATE_CONFIG", actions }, () => {
        if (chrome.runtime.lastError) console.log("Config update failed");
    });
}

// -------------------- EVENTS --------------------

actionInputs.forEach(input => {
    input.addEventListener('change', () => {
        sendConfigUpdate();
    });
});

btnPlay.onclick = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab) return;

  const actions = getSelectedActions();
  if (actions.length === 0) {
      alert("Please select at least one action.");
      return;
  }

  if (!isRunning) {
    btnCount.textContent = "0";
    statusLabel.textContent = "Initiating redaction protocol...";
    
    chrome.tabs.sendMessage(tab.id, { type: "START", actions, limit: 9999 }, (res) => {
      if (chrome.runtime.lastError) {
        alert("Please refresh Instagram page.");
        resetUI();
      } else {
          isRunning = true;
          isPaused = false;
          updatePlayButtonUI();
      }
    });
  } else {
    isPaused = !isPaused;
    updatePlayButtonUI();
    if (isPaused) {
      chrome.tabs.sendMessage(tab.id, { type: "PAUSE" }, () => chrome.runtime.lastError);
    } else {
      chrome.tabs.sendMessage(tab.id, { type: "UPDATE_CONFIG", actions }, () => {
          chrome.tabs.sendMessage(tab.id, { type: "RESUME" }, () => chrome.runtime.lastError);
      });
    }
  }
};

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "STATS_UPDATE") {
    updateStatsUI(msg.stats, msg.msg);
  }
  if (msg.type === "WORKFLOW_COMPLETE") {
    resetUI();
    if (msg.summary) {
        statusLabel.textContent = msg.summary;
    }
  }
});
