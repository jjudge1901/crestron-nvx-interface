// Minimal WebXPanel Connection Script for Crestron CP3
// This creates a simple CrComLib interface without requiring the full CH5 library

(function () {
    'use strict';

    // WebSocket connection
    let ws = null;
    let isConnected = false;
    let reconnectTimer = null;
    let subscriptions = new Map();

    // Configuration
    const config = {
        host: window.location.hostname,
        port: 49200,
        ipId: '04',
        reconnectDelay: 5000
    };

    // Create CrComLib namespace
    window.CrComLib = {
        publishEvent: publishEvent,
        subscribeState: subscribeState,
        isConnected: () => isConnected,
        connect: connect
    };

    // Create WebXPanel namespace for compatibility
    window.WebXPanel = {
        default: {
            initialize: function (opts) {
                if (opts && opts.host) config.host = opts.host;
                if (opts && opts.ipId) config.ipId = opts.ipId;
                connect();
            }
        }
    };

    function connect() {
        if (ws && ws.readyState === WebSocket.OPEN) return;

        // CP3 uses secure WebSocket on port 49200
        const wsUrl = `wss://${config.host}:${config.port}/cws/${config.ipId}`;
        console.log('[WebXPanel] Connecting to:', wsUrl);

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = function () {
                console.log('[WebXPanel] Connected!');
                isConnected = true;
                updateConnectionStatus(true);

                // Request initial states for all subscriptions
                subscriptions.forEach((callbacks, key) => {
                    const [type, join] = key.split(':');
                    requestState(type, join);
                });
            };

            ws.onmessage = function (event) {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('[WebXPanel] Parse error:', e);
                }
            };

            ws.onerror = function (error) {
                console.error('[WebXPanel] WebSocket error:', error);
            };

            ws.onclose = function () {
                console.log('[WebXPanel] Disconnected');
                isConnected = false;
                updateConnectionStatus(false);

                // Attempt reconnect
                if (reconnectTimer) clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(connect, config.reconnectDelay);
            };

        } catch (e) {
            console.error('[WebXPanel] Connection error:', e);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(connect, config.reconnectDelay);
        }
    }

    function publishEvent(type, join, value) {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn('[WebXPanel] Not connected, cannot publish');
            return;
        }

        const msg = {
            type: 'cw',
            action: 'set',
            data: {}
        };

        if (type === 'b') {
            msg.data[`b${join}`] = value;
        } else if (type === 'n') {
            msg.data[`n${join}`] = value;
        } else if (type === 's') {
            msg.data[`s${join}`] = value;
        }

        console.log('[WebXPanel] Publishing:', type, join, value);
        ws.send(JSON.stringify(msg));
    }

    function subscribeState(type, join, callback) {
        const key = `${type}:${join}`;

        if (!subscriptions.has(key)) {
            subscriptions.set(key, []);
        }

        subscriptions.get(key).push(callback);
        console.log('[WebXPanel] Subscribed:', type, join);

        // Request initial state if connected
        if (isConnected) {
            requestState(type, join);
        }
    }

    function requestState(type, join) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const msg = {
            type: 'cw',
            action: 'get',
            data: {}
        };

        if (type === 'b') {
            msg.data[`b${join}`] = null;
        } else if (type === 'n') {
            msg.data[`n${join}`] = null;
        } else if (type === 's') {
            msg.data[`s${join}`] = null;
        }

        ws.send(JSON.stringify(msg));
    }

    function handleMessage(data) {
        if (!data || !data.data) return;

        Object.keys(data.data).forEach(key => {
            const type = key.charAt(0);
            const join = key.substring(1);
            const value = data.data[key];
            const subKey = `${type}:${join}`;

            if (subscriptions.has(subKey)) {
                subscriptions.get(subKey).forEach(callback => {
                    try {
                        callback(value);
                    } catch (e) {
                        console.error('[WebXPanel] Callback error:', e);
                    }
                });
            }
        });
    }

    function updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            if (connected) {
                statusEl.textContent = 'Connected';
                statusEl.className = 'status-connected';
            } else {
                statusEl.textContent = 'Disconnected';
                statusEl.className = 'status-disconnected';
            }
        }
    }

    // Auto-connect when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connect);
    } else {
        connect();
    }

})();
