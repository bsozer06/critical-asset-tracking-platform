# Critical Asset Tracking Platform
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
- Deploy to cloud using the provided Docker setup

## File Reference

For detailed component info, see individual README files in `backend/` and `simulator/`.
- If RabbitMQ is configured, the broker receives the envelope (exchange/queue described in [`backend/Api/Settings/RabbitMqSettings.cs`](backend/Api/Settings/RabbitMqSettings.cs)).
- The backend consumer at [`backend/Infrastructure/Messaging/TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs) reads raw JSON, extracts the "message" payload and validates checksum using [`CriticalAssetTracking.Application.Security.IntegrityValidator`](backend/Application/Security/IntegrityValidator.cs).
- On success, messages are processed by [`CriticalAssetTracking.Application.Processors.TelemetryProcessor`](backend/Application/Processors/TelemetryProcessor.cs) which publishes telemetry to SignalR via a publisher adapter (registration done in [`backend/Api/Program.cs`](backend/Api/Program.cs)).

Important files & types
- [`backend/Api/Program.cs`](backend/Api/Program.cs) — application wiring and SignalR hub mapping
- [`backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs`](backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs) — background RabbitMQ consumer lifecycle
- [`backend/Infrastructure/Messaging/TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs) — RabbitMQ consumer implementation
- [`backend/Application/Processors/TelemetryProcessor.cs`](backend/Application/Processors/TelemetryProcessor.cs) — processes TelemetryEnvelope, publishes via ITelemetryPublisher
- [`backend/Application/Security/ChecksumCalculator.cs`](backend/Application/Security/ChecksumCalculator.cs) — computes CRC32 checksums
- [`simulator/CriticalAssetSimulator/Message.cs`](simulator/CriticalAssetSimulator/Message.cs) — builds telemetry envelope and checksum
- [`frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts) — Cesium map UI and orientation logic
- Cesium Worker assets are in [`frontend/critical-asset-frontend/src/assets/cesium`](frontend/critical-asset-frontend/src/assets/cesium) (pre-made worker js files with license headers)

Default configuration and notes
- RabbitMQ defaults (see [`backend/Api/Settings/RabbitMqSettings.cs`](backend/Api/Settings/RabbitMqSettings.cs)):
  - Host: `localhost`
  - Port: `5673`
  - Exchange: `catp.exchange`
  - Queue: `catp.telemetry.queue`
  - Routing Key: `telemetry`
- SignalR Hub endpoint is `/hubs/telemetry` (see [`backend/Api/Program.cs`](backend/Api/Program.cs))
- Frontend environment: [`frontend/critical-asset-frontend/src/environments/environment.ts`](frontend/critical-asset-frontend/src/environments/environment.ts)

Troubleshooting
- If telemetry doesn't appear in UI:
  - Ensure backend is running and hub address matches frontend `environment.ts`.
  - Check backend logs (console) for consumer output — [`TelemetryConsumer.cs`](backend/Infrastructure/Messaging/TelemetryConsumer.cs) prints raw JSON for debugging.
  - If using RabbitMQ, ensure exchange and queue exist and the consumer has correct permissions.
- Cesium errors often come from missing static assets or incorrect `CESIUM_BASE_URL`; confirm [`frontend/critical-asset-frontend/src/index.html`](frontend/critical-asset-frontend/src/index.html) and [`environment.ts`](frontend/critical-asset-frontend/src/environments/environment.ts) match.

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
