
# Critical Asset Tracking Frontend

Modern real-time asset tracking dashboard built with Angular and Cesium.

## 🚀 Quick Start

### Run with Docker (Recommended)
1. From the project root, run:
   ```bash
   cd backend
   docker compose up --build
   ```
2. Open [http://localhost:5073](http://localhost:5073) in your browser.

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm start
   ```
3. App opens at [http://localhost:4200](http://localhost:4200)

## ✨ Features

- **Interactive 3D Cesium Map** — Real-time asset locations
- **Live Telemetry Panel** — Card-based, color-coded, expandable asset details
- **Zoom to Asset** — Click an asset to focus the map
- **Initial Zoom to All** — Map auto-zooms to show all assets on load
- **Responsive & Mobile Friendly** — Modern Material Design
- **Smooth Animations** — For map, panel, and UI transitions

## 🗂️ Project Structure

```
src/
  app/
    components/
      cesium-map/         # 3D map visualization
      telemetry-panel/    # Telemetry cards & details
    services/             # SignalR, helpers
  assets/
    cesium/               # Cesium JS library
  environments/           # Environment configs
```

## ⚙️ Configuration

Edit `src/environments/environment.ts` if you need to change API or Cesium settings:

```typescript
export const environment = {
  production: false,
  signalRHubUrl: 'http://localhost:5073/hubs/telemetry',
  cesiumBaseUrl: 'assets/cesium',
  cesiumIonToken: '' // Optional: add your Cesium Ion token
};
```

## 🛠️ Common Commands

```bash
# Start dev server
npm start
# Build for production
npm run build
# Run unit tests
npm test
```

## 🧩 How It Works

1. App connects to backend via SignalR for live telemetry
2. Cesium map displays and updates asset positions in real-time
3. Telemetry panel shows asset details, color-coded by type
4. Click an asset to zoom/focus the map

## 🖼️ Visual & UX Highlights

- Card-based telemetry panel with icons, colors, and smooth expand/collapse
- Zoom to asset on selection, or zoom to all on load
- Mobile-friendly, responsive layout
- Material Design color scheme for asset types

## 📝 Recent Improvements

- Modern card-based telemetry panel with icons and color badges
- Smooth animations for expand/collapse and map zoom
- Initial map zoom to fit all assets
- Click-to-zoom from telemetry panel to map
- Improved responsive layout and accessibility

See `FRONTEND_IMPROVEMENTS.md` for full details.

## 📚 Resources

- [Angular Documentation](https://angular.dev)
- [Cesium Documentation](https://cesium.com/docs/)
- [Angular Material](https://material.angular.io/)

---
For backend/API setup, see the main project README.
