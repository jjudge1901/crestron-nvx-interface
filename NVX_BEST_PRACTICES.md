# Crestron NVX & CH5 Interface — Reference

> **Target Hardware:** CP3, NVX-35x/36x series
> **Minimum Firmware:** 1.603+ (CP3 Secure Deployment)
> **Governance Note:** Governed by the AGENTS framework. Do not duplicate AGENTS procedures here.

---

## 1. System Architecture & IP Reference

| Device Name | IP Address | Equipment Type | Form Factor | Short Description |
|---|---|---|---|---|
| CP3 Processor | `192.168.90.40` | Control System | Rackmount | Master control processor and WebXPanel HTTP server |
| Camera | `192.168.90.41` | NVX Transceiver | Card (Chassis) | Routes raw camera video onto the multicast network |
| Prod Switcher | `192.168.90.42` | NVX Transceiver | Card (Chassis) | Routes production switcher output |
| Aux | `192.168.90.43` | NVX Transceiver | Portable | Auxiliary video input routing |
| Green Room | `192.168.90.44` | NVX Transceiver | Standalone | Local display routing for the Green Room |
| Stage Manager | `192.168.90.45` | NVX Transceiver | Standalone | Local display routing for the Stage Manager |
| FOH | `192.168.90.46` | NVX Transceiver | Standalone | Local display routing for the Front of House |

---

## 2. Authentication & Security (Forced Auth)

### Crestron "Forced Authentication" Policy
Starting with 3-Series firmware v1.603+ and all 4-Series processors, Crestron strictly enforces a **"Secure Deployment"** policy.
Upon the first boot after an `INIT` / `RESTORE`, the firmware *mandates* the creation of an administrator account via Toolbox before it will allow any network traffic, SIMPL file transfers, or WebXPanel connections.

### The WebXPanel Handshake Mechanics
Because `AUTH ON` is effectively required, the Web App must securely negotiate with the processor:
1. **The Rejection:** The CH5 Web App attempts to open a direct websocket (`wss://<CP3-IP>`) and is immediately rejected by the processor.
2. **The Token Request:** The `ch5-webxpanel` library catches the rejection and fires an HTTPS `GET` request to `/cws/websocket/getWebSocketToken`.
3. **The Prompt:** This specific endpoint is protected by Basic Authentication. If Chrome doesn't have a cached password, it throws the native browser Username/Password popup.
4. **The Validation:** When valid `ADDUSER` credentials (e.g., `webadmin`) are entered, the CP3 returns a temporary, cryptographic WebSocket Token.
5. **The Handshake:** The CH5 library appends the token to the URL (`wss://<CP3-IP>/?token=12345...`) and connects.

---

## 3. CH5 Signal Mapping & Data Types

When programming the CP3 to interface with NVX hardware, the UI must strictly reflect reality, not "fake" dummy logic.

| SIMPL Windows Type | CH5 Web UI Equivalent | Purpose in NVX Integration |
|---|---|---|
| **Digital** | Boolean (`b`) | **Online Status**: Tie `DeviceReady_F` to a digital feedback (`d_fb`) to show if the NVX is offline. |
| **Analog** | Integer (`n`) | **Routing State**: Map `ActiveVideoSource_F` to analog feedback (`an_fb`) to accurately reflect physical video routing. |
| **Serial** | String (`s`) | Text data (IP Addresses, stream names). |

> **CRITICAL**: Never use dummy logic (e.g., `Multiple NOT` or `Toggle` symbols) to drive UI feedback for NVX routing. The UI must instantly gray out if a switch dies or a device goes offline.

---

## 4. Toolbox Console Commands

| Command | Purpose |
|---|---|
| `IPT` | See the IP Table. The ultimate source of truth for whether WebXPanel or NVX endpoints are communicating with the processor. |
| `USERSTAT` | View current authentication settings and active user sessions. |
| `ADDUSER <usr> <pwd>` | Create an administrator account (required for modern firmware). |
| `AUTH ON` / `AUTH OFF` | Toggle processor-wide authentication. |
| `REBOOT` | Restart the processor. *Note: The webserver takes 2-3 minutes to initialize after reboot.* |

---

## 5. WebXPanel Status Codes & Errors

| Error Code / Message | Meaning | Resolution |
|---|---|---|
| `401 Unauthorized` | Missing Token / Bad Credentials | Enter correct Username/Password. Clear Chrome cache if it's injecting a bad password. |
| `blocked by CORS policy` | Cross-Origin Request Blocked | Disable Auth during local dev, use a CORS bypass extension, or deploy to CP3 internal webserver. |
| `WebSocket connection failed` | WSS Socket Rejected | The CP3 connection limit was reached (Zombie connections) OR the CP3 webserver is still rebooting. Issue a `REBOOT` to clear zombies. |

---

## 6. JavaScript Usage Pattern (CH5 Initialization)

```javascript
import { WebXPanel, isActive } from "@crestron/ch5-webxpanel";

const configuration = {
    host: '192.168.90.40', // CP3 IP Address
    ipId: '0x03',          // IP ID matching the SIMPL Windows WebXPanel symbol
    roomId: '',
};

if (isActive) {
    console.log("Initializing WebXPanel securely...");
    WebXPanel.initialize(configuration);
    
    // The CH5 library will automatically handle the getWebSocketToken
    // handshake if the processor responds with a 401 requirement.
}
```

---

## 7. Known Gotchas (Top 5)

1. **Multicast Flooding Kills the CP3 (IGMP Snooping)**: NVX routing relies on heavy Multicast video traffic. If the physical network switch lacks explicitly configured **IGMP Snooping** and an **IGMP Querier**, massive video streams will broadcast to every port, crashing the CP3 network card.
2. **Zombie WebXPanel Connections (Hot-Reload Trap)**: The CP3 has a strict limit on concurrent WebXPanel connections. `npm start` hot-reloading leaves previous `wss://` connections alive on the processor as "zombies". After a few saves, the CP3 silently rejects you. Fix: `REBOOT` the CP3.
3. **The CORS Trap**: Developing locally on `localhost:3000` with `AUTH ON` will fail because Chrome strictly blocks cross-origin websocket token requests. Deploy to the processor to resolve permanently.
4. **The Silent "Access Denied" Cache**: Chrome aggressively caches self-signed SSL blocks. You must explicitly open `https://192.168.90.40` in a new tab and click "Advanced > Proceed to Unsafe" to unblock the UI.
5. **Firmware Mismatches**: A mix of vastly different firmwares across NVX Transmitters and Receivers can cause a stream to silently fail to start even if the Multicast Address is perfectly matched. Keep endpoints updated and unified.
