# Web App Functional Specification: NVX Routing UI

> **Project:** CMA NVX Interface
> **Target Platform:** CH5 / HTML5 WebXPanel (Hosted on CP3)
> **Governance Note:** This document defines the Business Logic, User Experience (UX), and Functional Requirements for the web interface. Technical implementation details (Auth, Networking, Signal Mapping) are governed by `NVX_BEST_PRACTICES.md`.

---

## 1. Core Purpose
The Web App provides a streamlined, lightweight, browser-based interface allowing AV operators to dynamically route video from active Transmitters to physical Receiver display endpoints. It abstracts away the complex multicast networking, presenting a simple "Source to Destination" user experience.

---

## 2. User Interface Architecture

To ensure ease of use during live events, the UI should avoid looking like a complex engineering spreadsheet (matrix) and instead adopt a clean, **Zone-Based Card Layout**.

### Global Header
* **System Status Indicator:** A persistent icon/badge indicating the health of the WebXPanel secure websocket connection to the CP3 (`Online` / `Connecting...` / `Offline`).
* **Title:** Clear branding (e.g., "CMA Video Routing").

### The Zone Cards (Destinations)
The main canvas should render a dedicated "Card" or panel for each of the physical NVX Receivers.
There are exactly **3 Destination Zones**:
1. **Green Room**
2. **Stage Manager**
3. **Front of House (FOH)**

---

## 3. Operator Workflow & Routing Logic

Inside each of the 3 Zone Cards, the operator must be presented with the available video sources.

### The Source Selectors
Each Zone Card must contain selector buttons (or a dropdown menu) representing the 3 NVX Transmitters:
* `[ Camera ]`
* `[ Prod Switcher ]`
* `[ Aux ]`

### Active Feedback (The "Source of Truth")
* When an operator clicks a source button, the Web App sends a digital join to the CP3 to execute the route.
* **CRITICAL UX REQUIREMENT:** The UI must visually highlight the *active* source (e.g., bolded text, accented background color). This highlight state **must only update** when the Web App receives the corresponding Analog Feedback (`an_fb`) from the CP3 confirming that the NVX hardware has successfully subscribed to the multicast stream. 

---

## 4. Hardware Failure States & Visual Feedback

The Web App must never lie to the operator. It must explicitly handle hardware dropouts gracefully.

### 4.1 Single Endpoint Offline (NVX Drop)
If a physical NVX endpoint loses power or network connectivity:
* The CP3 will drop the `DeviceReady_F` digital signal for that specific zone.
* **UI Response:** The corresponding Zone Card in the Web App must immediately:
    * Turn gray/dim.
    * Display a prominent **"OFFLINE"** warning badge.
    * Disable (gray out) all Source selection buttons to prevent the operator from trying to route video to a dead endpoint.

### 4.2 Total System Disconnect (CP3 / WSS Drop)
If the browser loses its secure websocket connection to the CP3 processor (due to network failure, processor reboot, or session timeout):
* **UI Response:** A global, semi-transparent modal overlay must immediately cover the entire screen.
* It must display a message such as: *"Control System Connection Lost. Attempting to reconnect..."*
* It must completely lock out the UI so the operator cannot click buttons that will not reach the processor.
* The overlay must automatically clear the moment the WebXPanel authentication handshake succeeds and the socket reopens.

---

## 5. Design Aesthetics

* **Theme:** High-contrast dark mode is recommended for AV environments, reducing glare in darkened control booths.
* **Micro-interactions:** Buttons should have subtle hover states and click-depress animations to ensure the operator feels the system registering their input, even if the hardware takes 1-2 seconds to physically execute the video route. 
