# Raspberry Pi Shortcut Dashboard

A dashboard for displaying keyboard shortcuts and calendar events on a small Raspberry Pi screen. 

For features such as dynamic cards depending on the active application or calendar cards, you will need to set up a separate API on your desktop. The companion API project is located here: https://github.com/bethanyw0rks/rpi-dashboard-desktop-companion

## Run locally

From the project folder, start a simple static server:

```bash
python3 -m http.server 3000
```

Then open http://localhost:3000 in a browser.
