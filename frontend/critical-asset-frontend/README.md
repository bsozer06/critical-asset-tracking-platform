# Frontend Dashboard

Real-time asset tracking dashboard built with Angular and Cesium maps.

## Quick Start

### With Docker

The frontend runs automatically as part of the full platform:

```bash
cd backend
docker compose up --build
```

Open http://localhost:5073 in your browser.

### Local Development

```bash
npm install
npm start
```

App opens at http://localhost:4200

## Features

- **Interactive Cesium Map** — Visualize asset locations in real-time
- **Live Telemetry Panel** — View asset data (position, speed, altitude)
- **Real-time Updates** — SignalR connection streams data as it arrives
- **Responsive Design** — Works on desktop and mobile

## Project Structure

```
src/
├── main.ts                    # Bootstrap the app
├── index.html                 # Entry point
├── environments/              # Config by environment
├── app/
│   ├── components/
│   │   ├── cesium-map/       # Map visualization
│   │   └── telemetry-panel/  # Data display
│   ├── services/             # API communication
│   └── app.component.ts      # Root component
└── assets/
    └── cesium/               # Cesium JS library
```

## Configuration

Edit `src/environments/environment.ts` to configure:

```typescript
export const environment = {
  production: false,
  signalRUrl: 'http://localhost:5073/hubs/telemetry',
  cesiumBaseUrl: '/assets/cesium/'
};
```

## Development Commands

```bash
# Run dev server
npm start

# Build for production
npm run build

# Run unit tests
npm test

# Run end-to-end tests
npm run e2e
```

## How It Works

1. App connects to backend via SignalR at startup
2. Backend streams telemetry data to the connected client
3. Cesium map updates asset positions in real-time
4. Telemetry panel displays current asset data

## Key Components

### Cesium Map Component
Displays asset positions on an interactive 3D globe. Updates automatically as telemetry data arrives.

Location: `src/app/components/cesium-map/cesium-map.component.ts`

### Telemetry Panel
Shows detailed information about each asset including speed, altitude, and last update time.

Location: `src/app/components/telemetry-panel/telemetry-panel.component.ts`

## Next Steps

- Customize the map view in `cesium-map.component.ts`
- Add new telemetry fields to the panel
- Create additional components for analysis or alerts
- Style the UI in `app.component.css`

## Resources

- [Angular Documentation](https://angular.dev)
- [Cesium Documentation](https://cesium.com/docs/)
- [Angular CLI Guide](https://angular.dev/tools/cli)
