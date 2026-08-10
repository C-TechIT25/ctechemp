# C-Tech Sheet

React + Vite desktop app packaged with Electron and electron-builder.

## Development

```bash
npm install
npm run dev
```

## Windows build

Run this on Windows:

```bash
npm run electron:build
```

The installer is created in `release/`.

## macOS build

Build macOS packages on a Mac. electron-builder can target macOS with `dmg` and `zip`, but macOS signing and notarization require macOS.

```bash
npm install
npm run electron:build:mac
```

Architecture-specific builds:

```bash
npm run electron:build:mac:x64
npm run electron:build:mac:arm64
npm run electron:build:mac:universal
```

The output is created in `release/`.

For a custom macOS app icon, add an ICNS icon at `public/icon.icns` and set this in `package.json` under `build.mac`:

```json
"icon": "public/icon.icns"
```
