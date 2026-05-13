# Crestron NVX Integration & Debugging Guide

> **Governance Note:** General software development workflows, repository management, and code standards are strictly governed by the **AGENTS** framework. Do not duplicate AGENTS procedures here. This document serves *only* as a domain-specific technical reference for Crestron NVX and CH5 WebXPanel idiosyncrasies.

---

## 1. Zero-Loss Hardware Synchronization (SIMPL Windows)

The most common source of UI bugs in Crestron systems is "fake" logic. When programming the CP3 to interface with NVX hardware, the UI must strictly reflect reality.

* **The Golden Rule:** Never use dummy logic (e.g., `Multiple NOT` or `Toggle` symbols) to drive UI feedback. If a network switch dies or an NVX endpoint reboots, the UI must instantly gray out, not pretend the system is fine.
* **Online Status:** Always tie the physical `DeviceReady_F` (or equivalent) output pin from the hardware NVX symbol directly to the WebXPanel digital feedback (`d_fb`). This guarantees the Web App knows exactly when a device drops offline.
* **Routing State:** NVX routing relies on Analog values, not digital pulses. Always map the `ActiveVideoSource_F` analog output from the NVX symbol to the WebXPanel analog feedback (`an_fb`). This ensures the UI perfectly shadows what the Receiver is actually decoding, even if the route was changed via a different interface.

---

## 2. WebXPanel & Authentication (The CORS Trap)

When building CH5 Web Apps locally, Chrome's security policies will frequently clash with the CP3.

* **The Error:** If CP3 Authentication is enabled, developing a CH5 app locally on `http://localhost:3000` will silently fail. The browser console will show a `401 Unauthorized` or `blocked by CORS policy` error because Chrome strictly blocks cross-origin websocket token requests.
* **Local Dev Workaround:** 
    * *Option A:* Temporarily type `AUTH OFF` in the CP3 Text Console while developing.
    * *Option B:* Use an "Allow CORS: Access-Control-Allow-Origin" Chrome extension to bypass the browser restriction.
* **Production Resolution:** Deploying the compiled Web App directly to the CP3 internal web server permanently resolves the CORS issue. Once deployed, the Web App and the CP3 API share the exact same IP address, satisfying Chrome's origin requirements.

---

## 3. Browser Caching & SSL Certificates

WebXPanel relies on secure websockets (WSS), which are highly sensitive to certificate and credential caching.

* **The Silent "Access Denied":** Chrome aggressively caches self-signed SSL blocks and failed WebXPanel passwords. If the Web App is instantly rejecting your connection:
    1. Open `https://<CP3-IP-ADDRESS>` in a new tab and explicitly click **Advanced > Proceed to Unsafe**.
    2. If Chrome is automatically injecting a bad cached password in the background, forcefully override it in the URL: `https://<USERNAME>:<PASSWORD>@<CP3-IP-ADDRESS>`.
    3. When in doubt, use an Incognito Window to ensure a 100% clean connection slate.
* **CP3 Reboot Delays:** After issuing a `REBOOT` command via Toolbox, it takes the CP3 2 to 3 minutes to fully initialize its internal web services. WebXPanel will aggressively refuse connections during this initialization window.

---

## 4. Manual Hardware Routing (Bypassing the CP3)

If the SIMPL Windows program is acting up, you can prove the physical network and AV hardware work by bypassing the control system entirely.

1. **Grab the Stream:** Log into the **Transmitter's** web interface. Navigate to the Stream tab and copy its **Multicast Address** (e.g., `239.1.1.8`).
2. **Subscribe the Receiver:** Log into the **Receiver's** web interface. Navigate to the Stream tab, paste the Multicast Address into the subscription field, and click Save.
3. **Verify:** The status should change to "Stream started" within 3 seconds, proving the network infrastructure is healthy.

---

## 5. Firmware & Development Tools

When hunting down silent failures or dropped streams, rely on the correct tools and verify your firmware.

* **Firmware Mismatches:** NVX devices MUST be on compatible firmware versions to properly subscribe to each other. A mix of vastly different firmwares across Transmitters and Receivers can cause a stream to silently fail to start even if the Multicast Address is correct. Always keep endpoints updated and unified.
* **Crestron Toolbox (Text Console):** The ultimate source of truth for the CP3 processor.
  * Use the `IPT` command to instantly see if the WebXPanel (IP-ID) or NVX endpoints are officially communicating with the processor.
  * Use `ADDUSER`, `AUTH ON/OFF`, and `REBOOT` for rapid permission and security resets.
* **Chrome DevTools (Console & Network):** The ultimate source of truth for the Web App. Always monitor the Console for strict `[WXP]` authentication failures, secure Web Socket (`wss://`) disconnects, and strict browser CORS blocks.
