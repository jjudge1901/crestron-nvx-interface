"""
SIMPL Signal Typer v7
======================
F9 = type value into current cell + arrow down to next row
F10 = next phase
ESC = quit
"""

import keyboard
import pyautogui
import time

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05

# ── DIGITAL VALUES (rows 1-30) ───────────────────────────────────
DIGITAL = [
    "tx_cam_mode_toggle",           # row 1
    "tx_feed_mode_toggle",          # row 2
    "tx_daw_mode_toggle",           # row 3
    "rx_greenroom_mode_toggle",     # row 4
    "rx_stagemgr_mode_toggle",      # row 5
    "foh_mode_toggle",              # row 6
    "TX_Cam_Reboot",                # row 7
    "TX_Feed_Reboot",               # row 8
    "TX_DAW_Reboot",                # row 9
    "RX_GreenRoom_Reboot",          # row 10
    "RX_StageMgr_Reboot",           # row 11
    "FOH_Reboot",                   # row 12
    "TX_Cam_Online",                # row 13
    "TX_Feed_Online",               # row 14
    "TX_DAW_Online",                # row 15
    "RX_GreenRoom_Online",          # row 16
    "RX_StageMgr_Online",           # row 17
    "FOH_Online",                   # row 18
    "TX_Cam_HDCP_toggle",           # row 19
    "TX_Feed_HDCP_toggle",          # row 20
    "TX_DAW_HDCP_toggle",           # row 21
    "RX_GreenRoom_HDCP_toggle",     # row 22
    "RX_StageMgr_HDCP_toggle",      # row 23
    "FOH_HDCP_toggle",              # row 24
    "TX_Cam_Video_Sync",            # row 25
    "TX_Feed_Video_Sync",           # row 26
    "TX_DAW_Video_Sync",            # row 27
    "RX_GreenRoom_Video_Sync",      # row 28
    "RX_StageMgr_Video_Sync",       # row 29
    "FOH_Video_Sync",               # row 30
]

ANALOG = [
    "TX_Cam_Source_Select",          # row 11
    "TX_Feed_Source_Select",         # row 12
    "TX_DAW_Source_Select",          # row 13
    "RX_GreenRoom_Source_Select",    # row 14
    "RX_StageMgr_Source_Select",     # row 15
    "FOH_Source_Select",             # row 16
]

SERIAL = [
    "TX_Cam_Name",                   # row 1
    "TX_Feed_Name",                  # row 2
    "TX_DAW_Name",                   # row 3
    "RX_GreenRoom_Name",            # row 4
    "RX_StageMgr_Name",             # row 5
    "FOH_Name",                      # row 6
    "TX_Cam_Resolution",             # row 7
    "TX_Feed_Resolution",            # row 8
    "TX_DAW_Resolution",             # row 9
    "RX_GreenRoom_Resolution",       # row 10
    "RX_StageMgr_Resolution",        # row 11
    "FOH_Resolution",                # row 12
]

PHASES = [
    {"name": "DIGITAL LEFT (fb1-fb30)",          "start": "fb1",       "data": DIGITAL},
    {"name": "DIGITAL RIGHT (press1-press30)",   "start": "press1",    "data": DIGITAL},
    {"name": "ANALOG LEFT (an_fb11-an_fb16)",    "start": "an_fb11",   "data": ANALOG},
    {"name": "ANALOG RIGHT (an_act11-an_act16)", "start": "an_act11",  "data": ANALOG},
    {"name": "SERIAL LEFT (text_o1-text_o12)",   "start": "text_o1",   "data": SERIAL},
    {"name": "SERIAL RIGHT (text_i1-text_i12)",  "start": "text_i1",   "data": SERIAL},
]

phase_idx = 0
row_idx = 0
busy = False


def do_paste():
    global row_idx, busy
    if busy:
        return
    busy = True

    try:
        phase = PHASES[phase_idx]
        data = phase["data"]

        if row_idx >= len(data):
            print("\n  Phase complete! Press F10 for next phase.")
            return

        signal = data[row_idx]

        # Wait for F9 key release
        time.sleep(0.4)

        # Clear cell and type the value character by character
        pyautogui.hotkey("ctrl", "a")
        time.sleep(0.05)

        # Use pyperclip + ctrl+v for reliability with mixed case
        import pyperclip
        pyperclip.copy(signal)
        time.sleep(0.05)
        pyautogui.hotkey("ctrl", "v")
        time.sleep(0.2)

        # Confirm with Enter
        pyautogui.press("enter")
        time.sleep(0.3)

        # Move down with Down Arrow
        pyautogui.press("down")
        time.sleep(0.2)

        row_idx += 1
        remaining = len(data) - row_idx
        print("  [" + str(row_idx) + "/" + str(len(data)) + "] " + signal + "  (" + str(remaining) + " left)")

        if row_idx >= len(data):
            print("\n  >>> PHASE COMPLETE! Press F10 for next phase.")
    finally:
        busy = False


def next_phase():
    global phase_idx, row_idx
    phase_idx += 1
    row_idx = 0

    if phase_idx >= len(PHASES):
        print("\n" + "=" * 60)
        print("  ALL DONE! Save (Ctrl+S) and compile (F12).")
        print("=" * 60)
        return

    show_phase()


def show_phase():
    if phase_idx >= len(PHASES):
        return
    phase = PHASES[phase_idx]
    print()
    print("=" * 60)
    print("  PHASE " + str(phase_idx + 1) + "/" + str(len(PHASES)) + ": " + phase["name"])
    print()
    print("  1. Click on [ " + phase["start"] + " ] in SIMPL Windows")
    print("  2. Press F9 repeatedly (" + str(len(phase["data"])) + " times)")
    print("=" * 60)


if __name__ == "__main__":
    print()
    print("=" * 60)
    print("  SIMPL SIGNAL TYPER v7")
    print("=" * 60)
    print()
    print("  F9  = Type + move down")
    print("  F10 = Next phase")
    print("  ESC = Quit")
    print()

    show_phase()

    keyboard.add_hotkey("f9", do_paste)
    keyboard.add_hotkey("f10", next_phase)

    print("\n  Ready.\n")
    keyboard.wait("esc")
