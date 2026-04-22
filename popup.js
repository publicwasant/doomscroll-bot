const btnPlay = document.getElementById("btnPlay");
const btnCount = document.getElementById("btnCount");
const btnLabel = document.getElementById("btnLabel");
const statusLabel = document.getElementById("statusLabel");
const statusLabelWrap = document.getElementById("statusLabelWrap");
const actionInputs = document.querySelectorAll('input[name="action"]');

let isRunning = false;

// -------------------- SYNC STATE ON OPEN --------------------
async function syncState() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.url || !tab.url.includes("instagram.com")) return;

  chrome.tabs.sendMessage(tab.id, { type: "GET_STATE" }, (res) => {
    if (chrome.runtime.lastError || !res) return;

    isRunning = res.running;
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
function updatePlayButtonUI() {
    if (!isRunning) {
        btnLabel.style.display = "block";
        btnLabel.textContent = "START";
        btnCount.style.display = "none";
        btnPlay.classList.remove("is-running");
    } else {
        btnLabel.style.display = "none";
        btnCount.style.display = "block";
        btnPlay.classList.add("is-running");
    }
}

function updateStatsUI(stats, customMsg = "") {
  if (!stats) return;
  btnCount.textContent = stats.success || 0;
  if (customMsg) {
      statusLabel.textContent = customMsg;
  }
}

function resetUI() {
    isRunning = false;
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
        if (chrome.runtime.lastError) console.error("Config update failed");
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

  if (!isRunning) {
    // START
    const actions = getSelectedActions();
    if (actions.length === 0) {
        statusLabel.textContent = "Please select at least one activity.";
        return;
    }

    btnCount.textContent = "0";
    statusLabel.textContent = "Initiating redaction protocol...";
    
    chrome.tabs.sendMessage(tab.id, { type: "START", actions, limit: 9999 }, (res) => {
      if (chrome.runtime.lastError) {
        statusLabel.textContent = "Please refresh Instagram to sync.";
        resetUI();
      } else {
          isRunning = true;
          updatePlayButtonUI();
      }
    });
  } else {
    // STOP
    chrome.tabs.sendMessage(tab.id, { type: "STOP" }, (res) => {
        if (res && res.summary) {
            statusLabel.textContent = res.summary;
        }
        resetUI();
    });
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
