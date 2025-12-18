# Critical Asset Tracking Platform

This platform helps you track and visualize assets like vehicles, aircraft, drones in real time. Everyone is welcome to use, contribute, and improve this project.

---

## What’s Included

- **Backend API** — Handles telemetry, validates data, and streams updates.
- **Frontend Web App** — Modern dashboard with a 3D map and live asset panel.
- **Simulator** — Generates test data for all asset types.

---

## Quick Start

**With Docker (Recommended):**
```bash
cd backend
docker compose up --build
```
- Web App: [http://localhost:5073](http://localhost:5073)
- API: [http://localhost:5073/hubs/telemetry](http://localhost:5073/hubs/telemetry)
- RabbitMQ Admin: [http://localhost:15672](://localhost:15672) (user: `rabbitmq`, password: `rabbitmq`)

**Local Development:**
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
3. The frontend shows assets on a 3D map and in a live panel, with alerts for geofence events.

---

## Features

- Real-time updates with SignalR
- Interactive Cesium 3D map
- Card-based telemetry panel with icons and color badges
- Zoom to asset and zoom to all features
- Geofence drawing and alerts
- Responsive and mobile-friendly design
- Data integrity checks (CRC32)

---

## Configuration

- **Simulator:** Edit `simulator/CriticalAssetSimulator/config.json` to set asset counts, location, and output type.
- **Backend:** Edit `backend/Api/appsettings.json` for RabbitMQ and API settings.
- **Frontend:** Edit `frontend/critical-asset-frontend/src/environments/environment.ts` for API and Cesium settings.

---

## Contributing

Everyone is welcome! Please open issues or pull requests for improvements. Add tests for your changes if possible.

---

## Need Help?

- For backend/API: see [backend/Api/Program.cs](backend/Api/Program.cs)
- For UI: see [CesiumMapComponent](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts)
- For simulator: see [simulator/README.md](simulator/README.md)

---
# Critical Asset Tracking Platform

A real-time platform for tracking and visualizing assets like vehicles, aircraft, drones, and people. See live locations and details on an interactive map.

---

## What’s Included

- **Backend API** — Receives telemetry, validates data, and streams updates to the web dashboard.
- **Frontend Web App** — Modern dashboard with a 3D map, live asset panel, and alerts.
- **Simulator** — Generates realistic test data for all asset types.

---

## Quick Start

### With Docker (Recommended)

```bash
cd backend
docker compose up --build
```
- Web App: [http://localhost:5073](http://localhost:5073)
- API: [http://localhost:5073/hubs/telemetry](http://localhost:5073/hubs/telemetry)
- RabbitMQ Admin: [http://localhost:15672](http://localhost:15672) (: `rabbitmq`, password: `rabbitmq`)

### Local Development

1. **Backend**
  ```bash
  cd backend/Api
  dotnet restore
  dotnet build
  dotnet run
  ```
  Runs at http://localhost:5073

2. **Frontend**
  ```bash
  cd frontend/critical-asset-frontend
  npm install
  npm start
  ```
  Opens at http://localhost:4200

3. **Simulator**
  ```bash
  cd simulator/CriticalAssetSimulator
  dotnet run
  ```

---

## How It Works

1. **Simulator** sends asset telemetry (location, speed, etc.) to the backend.
2. **Backend** validates and broadcasts data to all connected clients.
3. **Frontend** shows assets on a 3D map and in a live panel, with alerts for geofence events.

---

## Features

- Real-time updates with SignalR
- Interactive Cesium 3D map
- Card-based telemetry panel with icons and color badges
- Zoom to asset and zoom to all features
- Geofence drawing and alerts
- Responsive and mobile-friendly design
- Data integrity checks (CRC32)

---

## Configuration

- **Simulator:** Edit `simulator/CriticalAssetSimulator/config.json` to set asset counts, location, and output type.
- **Backend:** Edit `backend/Api/appsettings.json` for RabbitMQ and API settings.
- **Frontend:** Edit `frontend/critical-asset-frontend/src/environments/environment.ts` for API and Cesium settings.

---

## CI/CD

For information about the CI/CD pipeline, see [CI/CD documentation](.github/workflows/README.md).

Contributing
- Follow typical Git workflow for feature branches, PRs, and code review.
- Add unit tests for your changes. See frontend tests in [`frontend/critical-asset-frontend/README.md`](frontend/critical-asset-frontend/README.md) and backend tests via `dotnet test`.
- Keep Cesium assets updated with care — they include licensing headers (Apache 2.0). See license lines in files under [`frontend/critical-asset-frontend/src/assets/cesium`](frontend/critical-asset-frontend/src/assets/cesium/).

License & acknowledgment
- Cesium assets used under Apache License 2.0 (see license headers in the Worker files under `src/assets/cesium`).
- Other source files should follow the project licensing (see root-level LICENSE if added).

Contact
- For questions about the backend architecture, see [`backend/Api/Program.cs`](backend/Api/Program.cs) and [`backend/Infrastructure/Messaging/TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs).
- For UI issues, consult [`CesiumMapComponent`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts).


## Contributing

- All are welcome! Please open issues or pull requests for improvements.
- Add tests for your changes.
- See [frontend/critical-asset-frontend/README.md](frontend/critical-asset-frontend/README.md) and [backend/README.md](backend/README.md) for more details.

---

## Need Help?

- For backend/API: see [`backend/Api/Program.cs`](backend/Api/Program.cs) and [`backend/Infrastructure/Messaging/TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs)
- For UI: see [`CesiumMapComponent`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts)
- For simulator: see [`simulator/README.md`](simulator/README.md)

---

## License

- Cesium assets: Apache 2.0 (see headers in `frontend/critical-asset-frontend/src/assets/cesium`)
- Project code: See LICENSE file if present

### Backend Config
Edit `backend/Api/appsettings.json` for RabbitMQ host and credentials.

## Building & Testing

**Backend:**
```bash
cd backend
dotnet build
dotnet test
```

**Frontend:**
```bash
cd frontend/critical-asset-frontend
npm ci
npm run test
```

**Simulator:**
```bash
cd simulator
dotnet build
```

## Features

- Real-time telemetry streaming with SignalR
- Interactive Cesium map for asset visualization
- Message queue support (RabbitMQ)
- Data integrity validation (CRC32 checksums)
- Docker containerization for easy deployment
- Multi-asset type simulation (Aircraft, LandVehicle, etc.)

## Next Steps

- Customize the simulator configuration in `config.json`
- Modify the map in `frontend/critical-asset-frontend/src/app/components/cesium-map/`
- Add custom telemetry processing in `backend/Application/Processors/`
## File Reference

See individual README files in `backend/` and `simulator/` for details.

**Key files:**
- [`backend/Api/Program.cs`](backend/Api/Program.cs): App startup and SignalR hub setup
- [`backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs`](backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs): RabbitMQ consumer service
- [`backend/Infrastructure/Messaging/TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs): Reads messages from RabbitMQ
- [`backend/Application/Processors/TelemetryProcessor.cs`](backend/Application/Processors/TelemetryProcessor.cs): Processes telemetry and publishes to SignalR
- [`backend/Application/Security/ChecksumCalculator.cs`](backend/Application/Security/ChecksumCalculator.cs): CRC32 checksum logic
- [`simulator/CriticalAssetSimulator/Message.cs`](simulator/CriticalAssetSimulator/Message.cs): Builds telemetry messages
- [`frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts): Cesium map UI
- Cesium worker files: [`frontend/critical-asset-frontend/src/assets/cesium`](frontend/critical-asset-frontend/src/assets/cesium)

**Default config:**
- RabbitMQ host: `localhost`, port: `5673`
- Exchange: `catp.exchange`, queue: `catp.telemetry.queue`, routing key: `telemetry`
- SignalR hub: `/hubs/telemetry`
- Frontend config: [`frontend/critical-asset-frontend/src/environments/environment.ts`](frontend/critical-asset-frontend/src/environments/environment.ts)

**Troubleshooting:**
- If telemetry is missing in the UI:
  - Check backend and frontend are running and hub URLs match
  - Review backend logs for errors
  - Make sure RabbitMQ exchange/queue exist and permissions are correct
- Cesium errors: Check static assets and `CESIUM_BASE_URL` in `index.html` and `environment.ts`