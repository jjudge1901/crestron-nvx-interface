# Crestron NVX Control Interface

A modern HTML5 (CH5) control interface for mediating NVX routing via a Crestron CP3 processor.

## Features
-   **Routing**: Drag-and-drop or "Take" workflow for NVX endpoints.
-   **Device Control**: 
    -   **TX/RX Mode**: Toggle endpoints between Transmitter and Receiver mode.
    -   **HDCP**: Toggle HDCP on/off per destination.
    -   **Reboot**: Pulse reboot signal to devices.
-   **responsive**: Works as a Web XPanel on PC/Mobile or on a TSW Touch Panel.

## Project Structure
-   `public/`: Contains all source files (HTML, CSS, JS). This is your "build" folder.
-   `public/js/config.js`: **EDIT THIS FILE** to set your CP3 IP, IP ID, and NVX Join IDs.

## How to Build & Deploy

### Option 1: Web XPanel (Run in Browser)
This project is pre-configured as a Web XPanel.
1.  **Configure**: Open `public/js/config.js` and set:
    -   `system.processorIp`: Your CP3 IP address.
    -   `system.ipId`: The IP ID assigned to the XPanel symbol in SIMPL Windows (e.g., `03`).
2.  **Deploy**:
    -   Copy the entire `public` folder to a web server.
    -   OR upload it to the CP3's internal web server (via FTP to `\HTML\`).
3.  **Run**: Open `index.html` in a web browser.

### Option 2: TSW Touch Panel (Touch Screen)
To deploy to a physical panel (TSW-770, etc.), you must archive it into a `.ch5z` file.
**Prerequisites**: Install Crestron CH5 Utilities (`npm install -g @crestron/ch5-utilities-cli`).

1.  **Build Archive**:
    Run the following command in this directory:
    ```bash
    ch5-cli archive -p crestron-nvx-interface -v 1.0.0 -r public -o dist
    ```
2.  **Load**:
    -   Upload the resulting `.ch5z` file (in `dist/`) to the touch panel via its web interface or Toolbox.
    -   In the panel settings, set the "Project" to this file.

## Configuration (SIMPL Windows)
Ensure your SIMPL program matches the Joins defined in `public/js/config.js`:
-   **Analog Joins (11-14)**: Source Select for Destinations.
-   **Digital Joins (31-34)**: HDCP Toggle.
-   **Digital Joins (41-44)**: TX/RX Mode Toggle.
-   **Digital Joins (51-54)**: Reboot Pulse.

## FAQ: VisionTools Pro-e
**Can I import this into VT Pro-e?**
**No.** VT Pro-e is for legacy Smart Graphics. This project uses CH5 (HTML5), which is the modern standard.
-   **Editing**: You edit the code in VS Code, not VT Pro-e.
-   **SIMPL Integration**: Instead of importing a `.vtz` file, you map the **Join IDs** manually in SIMPL Windows (using an "XPanel 2.0 Smart Graphics" symbol or similar Generic Web XPanel symbol), OR you can create a Contract file if preferred.
-   **This Project uses Manual Joins**: We defined specific IDs in `config.js` to keep it simple. Just match these numbers in your SIMPL program's IP Table.
