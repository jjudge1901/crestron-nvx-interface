# Crestron Programmer Integration Notes

**Project**: NVX HTML5 Control Interface
**Platform**: CH5 (HTML5 Web XPanel)
**Target Processor**: CP3
**IP ID**: 03 (Configurable in `config.js` but default is 03)

## Overview
This project is a **CH5 (HTML5)** interface. It replaces the traditional `.vtp` Smart Graphics project.
Instead of uploading a `.vtp`, you will upload the **Web Project** (the `public` folder) to the processor's interactable HTML directory.

## Deployment Instructions (Web Server)
1.  Extract the provided zip/folder.
2.  Connect to the **CP3** via Toolbox File Manager.
3.  Navigate to the `\HTML` directory.
4.  Upload the contents of the `public` folder here.
    *   *Ensure `index.html` is at the root of the directory you point the browser to.*
5.  **Important**: Enable the Web Server and Web XPanel on the CP3.
    *   Console: `webserver on`
    *   Console: `webserver type html5` (if required by firmware)

## SIMPL Windows Logic
You need to add a **Web XPanel** symbol to your program and drive it with the following Join Map.

### Symbol Configuration
*   **Device**: Web XPanel (HTML5)
*   **IP ID**: `03`
*   **Smart Graphics**: Yes (Contract-based joins)

### Signal Join Map (Remapped for Standard 32-Join XPanel)

Since we are not using a `.sgd` file, we are limited to joins 1-32. The layout is standardized for all 6 devices.

#### 1. Digital Joins (Tab 1: Digitals)
| Function | Join Range | Device 1 (ID 11) | Device 2 (ID 12) | ... | Device 6 (ID 23) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **TX/RX Mode** | 1-6 | Join **1** | Join **2** | ... | Join **6** |
| **Reboot** | 7-12 | Join **7** | Join **8** | ... | Join **12** |
| **Online FB** | 13-18 | Join **13** | Join **14** | ... | Join **18** |
| **HDCP Toggle** | 19-24 | Join **19** | Join **20** | ... | Join **24** |
| **Sync/Signal** | 25-30 | Join **25** | Join **26** | ... | Join **30** |

#### 2. Analog Joins (Tab 2: Analogs)
| Function | Join Range | Device 1 (ID 11) | Device 2 (ID 12) | ... | Device 6 (ID 23) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Source Select** | 11-16 | Join **11** | Join **12** | ... | Join **16** |

#### 3. Serial Joins (Tab 3: Serials)
| Function | Join Range | Device 1 (ID 11) | Device 2 (ID 12) | ... | Device 6 (ID 23) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Device Name** | 1-6 | Join **1** | Join **2** | ... | Join **6** |
| **Resolution** | 7-12 | Join **7** | Join **8** | ... | Join **12** |

### Logic Required
1.  **Routing**: When Analog Join `11` changes (from XPanel), route the corresponding Source ID to NVX Destination 1.
2.  **Mode Switching**:
    *   Monitor Digital Join `1`.
    *   If `High` (Press): Configure NVX 1 as **Transmitter**.
    *   If `Low` (Release): Configure NVX 1 as **Receiver**.
3.  **Reboot**:
    *   Monitor Digital Join `7`.
    *   If `Pulse` detected: Send `Reboot` command to NVX 1.

## Configuration
The frontend configuration (CP3 IP, IP ID) is stored in `js/config.js`.
If you change the IP ID in SIMPL, please update `config.js` or ask the integrator to do so.
