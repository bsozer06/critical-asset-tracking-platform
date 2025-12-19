# Critical Asset Tracking Platform

![Architecture](frontend/critical-asset-frontend/public/catp-architecture.png)

A platform for real-time tracking and visualization of assets (vehicles, aircraft, drones, etc.). Open for contributions and improvements.

---

## What's Included

- **Backend API** — Handles telemetry, validates data, and streams updates.
- **Frontend Web App** — Modern dashboard with a 3D map and live asset panel.
- **Simulator** — Generates test data for all asset types.

---

## Quick Start

### With Docker (Recommended)
```bash
cd backend
docker compose up --build
```
- Web App: [http://localhost:5073](http://localhost:5073)
- API: [http://localhost:5073/hubs/telemetry](http://localhost:5073/hubs/telemetry)
- RabbitMQ Admin: [http://localhost:15672](http://localhost:15672) (user: `rabbitmq`, password: `rabbitmq`)

### Local Development

1. **Backend**
  ```bash
  cd backend/Api
  dotnet restore
  dotnet build
  dotnet run
  ```
2. **Frontend**
  ```bash
  cd frontend/critical-asset-frontend
  npm install
  npm start
  ```
3. **Simulator**
  ```bash
  cd simulator/CriticalAssetSimulator
  dotnet run
  ```

---

## How It Works

1. The simulator sends asset telemetry to the backend.
2. The backend validates and broadcasts data to all connected clients.
3. The frontend displays assets on a 3D map and in a live panel, with geofence alerts.

### Demo

![Platform Demo](frontend/critical-asset-frontend/public/catp-normal-gif-2.gif)

---

## Features

- Real-time updates via SignalR
- Interactive Cesium 3D map
- Card-based telemetry panel with icons and color badges
- Zoom to asset/all features
- Geofence drawing and alerts
- Responsive, mobile-friendly design
- Data integrity checks (CRC32)

---

## Configuration

- **Simulator:** `simulator/CriticalAssetSimulator/config.json` — asset counts, location, output type
- **Backend:** `backend/Api/appsettings.json` — RabbitMQ and API settings
- **Frontend:** `frontend/critical-asset-frontend/src/environments/environment.ts` — API and Cesium settings

---

## CI/CD

See [CI/CD documentation](.github/workflows/README.md) for pipeline details.

---

## Contributing

Everyone is welcome! Please:
- Use feature branches, PRs, and code review.
- Add unit tests for your changes (see frontend and backend test instructions below).
- Keep Cesium assets updated and respect their Apache 2.0 license headers.
- See [`frontend/critical-asset-frontend/README.md`](frontend/critical-asset-frontend/README.md) for frontend tests, and use `dotnet test` for backend.

---

## License

- Cesium assets: Apache 2.0 (see headers in `frontend/critical-asset-frontend/src/assets/cesium`)
- Project code: See LICENSE file if present

---

## Troubleshooting

**Telemetry missing in the UI:**
- Ensure backend and frontend are running and hub URLs match
- Check backend logs for errors
- Verify RabbitMQ exchange/queue exist with correct permissions
- Default RabbitMQ: `localhost:5673`, exchange: `catp.exchange`, queue: `catp.telemetry.queue`

**Cesium errors:**
- Check static assets are loaded
- Verify `CESIUM_BASE_URL` in `index.html` and `environment.ts`

---

## More Info

- **Backend:** See [`backend/README.md`](backend/README.md)
- **Frontend:** See [`frontend/critical-asset-frontend/README.md`](frontend/critical-asset-frontend/README.md)
- **Simulator:** See [`simulator/README.md`](simulator/README.md)
