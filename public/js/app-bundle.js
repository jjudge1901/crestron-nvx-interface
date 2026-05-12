// ========================================
// CRESTRON NVX CONTROL — v2.0 (AGENTS-Aligned)
// Single file: config + app logic
// No ES6 modules (CP3 compatible)
// ========================================

// ── CONFIGURATION (Single Source of Truth) ──────────────────────
const CONFIG = {
    system: {
        processorIp: "192.168.90.40",
        ipId: "04",
        webXpanel: true
    },

    // 6 NVX Endpoints — names match actual hardware
    // Join map: see PROGRAMMER_NOTES.md
    endpoints: [
        // TRANSMITTERS (DM-NVX-360C cards in rack chassis)
        {
            id: 11,
            defaultName: "Camera",
            ip: "192.168.90.41",
            join: 11,
            modeJoin: 1,
            rebootJoin: 7,
            onlineJoin: 13,
            hdcpJoin: 19,
            syncJoin: 25,
            nameJoin: 1,
            resJoin: 7,
            icon: "fa-video",
            defaultTx: true,
            chassis: true
        },
        {
            id: 12,
            defaultName: "Prod Switcher",
            ip: "192.168.90.42",
            join: 12,
            modeJoin: 2,
            rebootJoin: 8,
            onlineJoin: 14,
            hdcpJoin: 20,
            syncJoin: 26,
            nameJoin: 2,
            resJoin: 8,
            icon: "fa-satellite-dish",
            defaultTx: true,
            chassis: true
        },
        {
            id: 13,
            defaultName: "Aux",
            ip: "192.168.90.43",
            join: 13,
            modeJoin: 3,
            rebootJoin: 9,
            onlineJoin: 15,
            hdcpJoin: 21,
            syncJoin: 27,
            nameJoin: 3,
            resJoin: 9,
            icon: "fa-music",
            defaultTx: true,
            chassis: true
        },

        // RECEIVERS (standalone DM-NVX-350)
        {
            id: 21,
            defaultName: "Green Room",
            ip: "192.168.90.44",
            join: 14,
            modeJoin: 4,
            rebootJoin: 10,
            onlineJoin: 16,
            hdcpJoin: 22,
            syncJoin: 28,
            nameJoin: 4,
            resJoin: 10,
            icon: "fa-tv",
            defaultTx: false,
            chassis: false
        },
        {
            id: 22,
            defaultName: "Stage Manager",
            ip: "192.168.90.45",
            join: 15,
            modeJoin: 5,
            rebootJoin: 11,
            onlineJoin: 17,
            hdcpJoin: 23,
            syncJoin: 29,
            nameJoin: 5,
            resJoin: 11,
            icon: "fa-clipboard-user",
            defaultTx: false,
            chassis: false
        },
        {
            id: 23,
            defaultName: "FOH",
            ip: "192.168.90.46",
            join: 16,
            modeJoin: 6,
            rebootJoin: 12,
            onlineJoin: 18,
            hdcpJoin: 24,
            syncJoin: 30,
            nameJoin: 6,
            resJoin: 12,
            icon: "fa-sliders",
            defaultTx: true,
            chassis: false
        }
    ]
};

// ── STATE ───────────────────────────────────────────────────────
let selectedDestinations = new Set();
let pendingSource = null;
let pendingModeChangeDevice = null;
const deviceState = new Map();
let isMockMode = false;

// ── CRESTRON LIBRARY ────────────────────────────────────────────
// CrComLib is provided by webxpanel-min.js when connected to CP3.
// If unavailable, mock mode is activated with a visible UI indicator.
const CrComLib = window.CrComLib || null;

if (!CrComLib) {
    isMockMode = true;
    window.CrComLib = {
        publishEvent: function(type, id, value) {
            console.log("[MOCK] Publish " + type + " ID:" + id + " Value:" + value);
        },
        subscribeState: function(type, id, cb) {
            console.log("[MOCK] Subscribe " + type + " ID:" + id);
        }
    };
}

function getCrComLib() {
    return window.CrComLib;
}

// ── INITIALIZATION ──────────────────────────────────────────────
function initWebXPanel() {
    if (!CONFIG.system.webXpanel) return;

    // Official Crestron WebXPanel library
    if (window.WebXPanel && window.WebXPanel.getWebXPanel && !isMockMode) {
        try {
            var wxp = window.WebXPanel.getWebXPanel(true);
            var panel = wxp.WebXPanel;
            var events = wxp.WebXPanelEvents;

            // Initialize connection to CP3
            panel.initialize({
                host: CONFIG.system.processorIp,
                ipId: "0x" + CONFIG.system.ipId
            });

            // Connection status events
            panel.addEventListener(events.CONNECT_CIP, function() {
                console.log("[NVX] CIP Connected to CP3. Delaying state resync...");
                updateConnectionStatus(true);
                
                // Explicitly pull states 500ms after connect to guarantee we have CP3's values
                setTimeout(function() {
                    console.log("[NVX] Processing CP3 initial states...");
                    if (window.CrComLib) {
                        CONFIG.endpoints.forEach(function(ep) {
                            var state = deviceState.get(ep.id);
                            
                            if (ep.onlineJoin) {
                                var val = window.CrComLib.getState("b", ep.onlineJoin.toString());
                                if (val !== undefined && val !== null) {
                                    state.online = val;
                                    updateDeviceStatus(ep.id);
                                }
                            }
                            if (ep.modeJoin) {
                                var mVal = window.CrComLib.getState("b", ep.modeJoin.toString());
                                if (mVal !== undefined && mVal !== null) {
                                    state.isTx = mVal;
                                }
                            }
                            if (ep.join) {
                                var rVal = window.CrComLib.getState("n", ep.join.toString());
                                if (rVal !== undefined && rVal !== null) {
                                    updateRoutingStatus(ep.id, rVal);
                                }
                            }
                        });
                        // Re-render entirely with exact pulled states
                        renderLists();
                    }
                }, 500);
            });

            panel.addEventListener(events.DISCONNECT_CIP, function() {
                console.log("[NVX] CIP Disconnected from CP3");
                updateConnectionStatus(false);
            });

            panel.addEventListener(events.CONNECT_WS, function() {
                console.log("[NVX] WebSocket connected");
            });

            panel.addEventListener(events.ERROR_WS, function(e) {
                console.error("[NVX] WebSocket error:", e);
            });

            console.log("[NVX] WebXPanel initializing: " + CONFIG.system.processorIp + " IP-ID:" + CONFIG.system.ipId);
        } catch (e) {
            console.error("[NVX] WebXPanel init error:", e);
            isMockMode = true;
            updateMockBanner();
        }
    } else {
        console.warn("[NVX] Running in MOCK mode — no CP3 connection");
    }
}

function updateConnectionStatus(connected) {
    var statusEl = document.getElementById("connection-status");
    if (statusEl) {
        if (connected) {
            statusEl.textContent = "Connected";
            statusEl.className = "status-connected";
        } else {
            statusEl.textContent = "Disconnected";
            statusEl.className = "status-disconnected";
        }
    }
}

function initUI() {
    // Build device state from config
    CONFIG.endpoints.forEach(function(ep) {
        deviceState.set(ep.id, {
            id: ep.id,
            defaultName: ep.defaultName,
            ip: ep.ip,
            join: ep.join,
            modeJoin: ep.modeJoin,
            rebootJoin: ep.rebootJoin,
            onlineJoin: ep.onlineJoin,
            hdcpJoin: ep.hdcpJoin,
            syncJoin: ep.syncJoin,
            nameJoin: ep.nameJoin,
            resJoin: ep.resJoin,
            icon: ep.icon,
            isTx: ep.defaultTx || false,
            chassis: ep.chassis || false,
            online: true,
            name: ep.defaultName,
            sync: false,
            resolution: "",
            rebooting: false
        });
    });

    renderLists();
    subscribeAll();
    setupModal();
    updateClock();
    setInterval(updateClock, 60000);
    updateMockBanner();

    // Footer buttons
    var takeBtn = document.getElementById("take-btn");
    if (takeBtn) takeBtn.addEventListener("click", executeTake);

    var resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", function() {
            selectedDestinations.clear();
            pendingSource = null;
            document.querySelectorAll(".dest-card").forEach(function(el) { el.classList.remove("selected"); });
            document.querySelectorAll(".source-card").forEach(function(el) { el.classList.remove("selected-source"); });
            var src = document.querySelector(".sources-section");
            if (src) src.classList.remove("active");
            updateTakeButton();
        });
    }
}

function updateMockBanner() {
    var statusEl = document.getElementById("connection-status");
    if (statusEl && isMockMode) {
        statusEl.textContent = "MOCK MODE";
        statusEl.className = "status-mock";
    }
}

// ── MODAL ───────────────────────────────────────────────────────
function setupModal() {
    var confirmBtn = document.getElementById("modal-confirm");
    var cancelBtn = document.getElementById("modal-cancel");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", function() {
            if (pendingModeChangeDevice) executeModeChange(pendingModeChangeDevice);
            closeModal();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }
}

function openModal(device) {
    pendingModeChangeDevice = device;
    var modal = document.getElementById("modal-overlay");
    var nameEl = document.getElementById("modal-device-name");
    if (nameEl) nameEl.textContent = device.name;
    if (modal) modal.classList.remove("hidden");
}

function closeModal() {
    pendingModeChangeDevice = null;
    var modal = document.getElementById("modal-overlay");
    if (modal) modal.classList.add("hidden");
}

// ── SUBSCRIPTIONS ───────────────────────────────────────────────
function subscribeAll() {
    var lib = getCrComLib();
    console.log("[NVX] Subscribing to all device states...");

    CONFIG.endpoints.forEach(function(ep) {
        // Mode feedback (digital)
        if (ep.modeJoin) {
            lib.subscribeState("b", ep.modeJoin.toString(), function(val) {
                console.log("[NVX] Mode " + ep.id + " -> " + val);
                var state = deviceState.get(ep.id);
                if (state.isTx !== val) {
                    state.isTx = val;
                    if (!state.rebooting) renderLists();
                }
            });
        }

        // Online feedback (digital)
        if (ep.onlineJoin) {
            lib.subscribeState("b", ep.onlineJoin.toString(), function(val) {
                console.log("[NVX] Online " + ep.id + " -> " + val);
                var state = deviceState.get(ep.id);
                state.online = val;
                if (val && state.rebooting) {
                    state.rebooting = false;
                    renderLists();
                }
                updateDeviceStatus(ep.id);
            });
        }

        // Device name (serial)
        if (ep.nameJoin) {
            lib.subscribeState("s", ep.nameJoin.toString(), function(val) {
                if (val && val.length > 0) {
                    var state = deviceState.get(ep.id);
                    state.name = val;
                    updateDeviceText(ep.id);
                }
            });
        }

        // HDCP feedback (digital)
        if (ep.hdcpJoin) {
            lib.subscribeState("b", ep.hdcpJoin.toString(), function(val) {
                updateHdcpStatus(ep.id, val);
            });
        }

        // Route feedback (analog)
        if (ep.join) {
            lib.subscribeState("n", ep.join.toString(), function(val) {
                console.log("[NVX] Route " + ep.id + " -> source " + val);
                updateRoutingStatus(ep.id, val);
            });
        }

        // Sync feedback (digital)
        if (ep.syncJoin) {
            lib.subscribeState("b", ep.syncJoin.toString(), function(val) {
                var state = deviceState.get(ep.id);
                state.sync = val;
                updateSourceInfo(ep.id);
            });
        }

        // Resolution (serial)
        if (ep.resJoin) {
            lib.subscribeState("s", ep.resJoin.toString(), function(val) {
                var state = deviceState.get(ep.id);
                state.resolution = val;
                updateSourceInfo(ep.id);
            });
        }
    });
}

// ── RENDERING ───────────────────────────────────────────────────
function renderLists() {
    var destGrid = document.getElementById("destinations-grid");
    var sourceList = document.getElementById("sources-list");
    if (!destGrid || !sourceList) return;

    destGrid.innerHTML = "";
    sourceList.innerHTML = "";
    selectedDestinations.clear();
    pendingSource = null;
    updateTakeButton();

    var sourcesSection = document.querySelector(".sources-section");
    if (sourcesSection) sourcesSection.classList.remove("active");

    deviceState.forEach(function(device) {
        if (device.isTx) {
            renderAsSource(device, sourceList);
        } else {
            renderAsDestination(device, destGrid);
        }
    });
}

function renderAsDestination(device, container) {
    var card = document.createElement("div");
    card.className = "dest-card";
    card.id = "dest-" + device.id;
    if (!device.online) card.classList.add("offline");
    if (device.rebooting) card.classList.add("rebooting");

    var hdcpId = "hdcp-" + device.id;
    var modeId = "mode-" + device.id;
    var rebootId = "reboot-" + device.id;

    var chassisNote = device.chassis ? '<div class="chassis-note"><i class="fa-solid fa-server"></i> Chassis Card</div>' : '';

    card.innerHTML =
        '<div class="card-top-bar">' +
            '<span class="mode-indicator rx-indicator"><i class="fa-solid fa-circle"></i> RX MODE</span>' +
            '<button id="' + modeId + '" class="mode-btn" title="Switch to TX Mode"><i class="fa-solid fa-arrow-right-arrow-left"></i> Switch TX</button>' +
        '</div>' +
        '<i class="fa-solid ' + (device.icon || "fa-tv") + ' main-icon"></i>' +
        '<h3 class="device-name">' + device.name + '</h3>' +
        chassisNote +
        '<div class="routing-status">No Source</div>' +
        '<div class="card-bottom-bar">' +
            '<button id="' + hdcpId + '" class="hdcp-btn">' +
                '<i class="fa-solid fa-lock"></i> HDCP: OFF' +
            '</button>' +
            '<button id="' + rebootId + '" class="reboot-btn">' +
                '<i class="fa-solid fa-power-off"></i> Reboot' +
            '</button>' +
        '</div>';

    // Card click = select destination
    card.addEventListener("click", function(e) {
        if (!e.target.closest("button")) toggleDestination(device);
    });

    // Button handlers
    var hBtn = card.querySelector("#" + hdcpId);
    if (hBtn) hBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleHdcp(device);
    });

    var mBtn = card.querySelector("#" + modeId);
    if (mBtn) mBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        requestModeChange(device);
    });

    var rBtn = card.querySelector("#" + rebootId);
    if (rBtn) rBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        rebootDevice(device);
    });

    container.appendChild(card);
}

function renderAsSource(device, container) {
    var card = document.createElement("div");
    card.className = "source-card";
    card.id = "source-" + device.id;
    if (!device.online) card.classList.add("offline");
    if (device.rebooting) card.classList.add("rebooting");

    var modeId = "mode-src-" + device.id;

    var chassisNote = device.chassis ? '<div class="chassis-note"><i class="fa-solid fa-server"></i> Chassis Card</div>' : '';

    card.innerHTML =
        '<div class="card-top-bar">' +
            '<span class="mode-indicator tx-indicator"><i class="fa-solid fa-circle"></i> TX MODE</span>' +
            '<button id="' + modeId + '" class="mode-btn tx-mode" title="Switch to RX Mode"><i class="fa-solid fa-arrow-right-arrow-left"></i> Switch RX</button>' +
        '</div>' +
        '<i class="fa-solid ' + (device.icon || "fa-box") + '"></i>' +
        '<h3 class="device-name">' + device.name + '</h3>' +
        chassisNote +
        '<div class="source-info">' +
            '<span class="sync-dot ' + (device.sync ? "sync-active" : "") + '"></span>' +
            '<span class="res-text">' + (device.resolution || "No Signal") + '</span>' +
        '</div>';

    card.addEventListener("click", function(e) {
        if (!e.target.closest("button")) selectSource(device);
    });

    var mBtn = card.querySelector("#" + modeId);
    if (mBtn) mBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        requestModeChange(device);
    });

    container.appendChild(card);
}

// ── UI UPDATES ──────────────────────────────────────────────────
function updateDeviceStatus(id) {
    var state = deviceState.get(id);
    var target = document.getElementById("dest-" + id) || document.getElementById("source-" + id);
    if (target) {
        if (state.online) target.classList.remove("offline");
        else target.classList.add("offline");
    }
}

function updateDeviceText(id) {
    var state = deviceState.get(id);
    var target = document.getElementById("dest-" + id) || document.getElementById("source-" + id);
    if (target) {
        var h3 = target.querySelector(".device-name");
        if (h3) h3.textContent = state.name;
    }
}

function updateSourceInfo(id) {
    var state = deviceState.get(id);
    var srcEl = document.getElementById("source-" + id);
    if (!srcEl) return;
    var dot = srcEl.querySelector(".sync-dot");
    var res = srcEl.querySelector(".res-text");
    if (dot) {
        if (state.sync) dot.classList.add("sync-active");
        else dot.classList.remove("sync-active");
    }
    if (res) res.textContent = state.resolution || "No Signal";
}

function updateRoutingStatus(destId, sourceId) {
    var destCard = document.getElementById("dest-" + destId);
    if (!destCard) return;
    var sourceDevice = deviceState.get(sourceId);
    var statusDiv = destCard.querySelector(".routing-status");
    if (!statusDiv) return;

    if (sourceDevice) {
        statusDiv.textContent = "Source: " + sourceDevice.name;
        statusDiv.style.color = "var(--active-color)";
    } else if (sourceId === 0) {
        statusDiv.textContent = "No Source";
        statusDiv.style.color = "#888";
    }
}

function updateHdcpStatus(destId, isActive) {
    var btn = document.getElementById("hdcp-" + destId);
    if (!btn) return;
    if (isActive) {
        btn.classList.add("active");
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> HDCP: ON';
    } else {
        btn.classList.remove("active");
        btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> HDCP: OFF';
    }
}

// ── ROUTING WORKFLOW ────────────────────────────────────────────
function toggleDestination(device) {
    if (selectedDestinations.has(device)) {
        selectedDestinations.delete(device);
        var el = document.getElementById("dest-" + device.id);
        if (el) el.classList.remove("selected");
    } else {
        selectedDestinations.add(device);
        var el2 = document.getElementById("dest-" + device.id);
        if (el2) el2.classList.add("selected");
    }
    updateTakeButton();

    var sourcesSection = document.querySelector(".sources-section");
    if (sourcesSection) {
        if (selectedDestinations.size > 0) {
            sourcesSection.classList.add("active");
            sourcesSection.scrollIntoView({ behavior: "smooth", block: "end" });
        } else {
            sourcesSection.classList.remove("active");
            pendingSource = null;
            document.querySelectorAll(".source-card").forEach(function(el) {
                el.classList.remove("selected-source");
            });
        }
    }
}

function selectSource(device) {
    if (selectedDestinations.size === 0) return;
    pendingSource = device;
    document.querySelectorAll(".source-card").forEach(function(el) {
        el.classList.remove("selected-source");
    });
    var el = document.getElementById("source-" + device.id);
    if (el) el.classList.add("selected-source");
    updateTakeButton();
}

function updateTakeButton() {
    var btn = document.getElementById("take-btn");
    if (!btn) return;
    if (selectedDestinations.size > 0 && pendingSource) {
        btn.disabled = false;
        var count = selectedDestinations.size;
        var destText = count === 1
            ? Array.from(selectedDestinations)[0].name
            : count + " Displays";
        btn.innerHTML = "TAKE<br><small>" + pendingSource.name + " → " + destText + "</small>";
    } else {
        btn.disabled = true;
        btn.innerHTML = 'TAKE <i class="fa-solid fa-check"></i>';
    }
}

function executeTake() {
    if (selectedDestinations.size === 0 || !pendingSource) return;
    var lib = getCrComLib();

    selectedDestinations.forEach(function(dest) {
        lib.publishEvent("n", dest.join.toString(), pendingSource.id);
        updateRoutingStatus(dest.id, pendingSource.id);
    });

    // Reset selection state
    pendingSource = null;
    selectedDestinations.clear();
    document.querySelectorAll(".dest-card").forEach(function(el) { el.classList.remove("selected"); });
    document.querySelectorAll(".source-card").forEach(function(el) { el.classList.remove("selected-source"); });
    var sourcesSection = document.querySelector(".sources-section");
    if (sourcesSection) sourcesSection.classList.remove("active");
    updateTakeButton();
}

// ── DEVICE CONTROLS ─────────────────────────────────────────────
function rebootDevice(device) {
    if (!device.rebootJoin) return;
    if (!confirm("Reboot " + device.name + "? This takes ~2 minutes.")) return;
    var lib = getCrComLib();
    lib.publishEvent("b", device.rebootJoin.toString(), true);
    setTimeout(function() { lib.publishEvent("b", device.rebootJoin.toString(), false); }, 200);
}

function requestModeChange(device) {
    if (!device.modeJoin) return;
    openModal(device);
}

function executeModeChange(device) {
    var lib = getCrComLib();

    // 1. Toggle mode
    lib.publishEvent("b", device.modeJoin.toString(), true);
    setTimeout(function() { lib.publishEvent("b", device.modeJoin.toString(), false); }, 100);

    // 2. Reboot
    if (device.rebootJoin) {
        setTimeout(function() {
            lib.publishEvent("b", device.rebootJoin.toString(), true);
            setTimeout(function() { lib.publishEvent("b", device.rebootJoin.toString(), false); }, 200);
        }, 150);
    }

    // 3. Gray out card
    var state = deviceState.get(device.id);
    state.rebooting = true;
    renderLists();

    // 4. Fallback: clear rebooting after 2 minutes if no online feedback
    setTimeout(function() {
        if (state.rebooting) {
            state.rebooting = false;
            renderLists();
        }
    }, 120000);
}

function toggleHdcp(device) {
    if (!device.hdcpJoin) return;
    var lib = getCrComLib();
    lib.publishEvent("b", device.hdcpJoin.toString(), true);
    setTimeout(function() { lib.publishEvent("b", device.hdcpJoin.toString(), false); }, 100);
    var btn = document.getElementById("hdcp-" + device.id);
    if (btn) {
        var isActive = btn.classList.contains("active");
        updateHdcpStatus(device.id, !isActive);
    }
}

// ── UTILITIES ───────────────────────────────────────────────────
function updateClock() {
    var now = new Date();
    var clock = document.getElementById("clock");
    if (clock) clock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── BOOT ────────────────────────────────────────────────────────
window.onload = function() {
    initWebXPanel();
    initUI();
};
