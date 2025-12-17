# Critical Asset Tracking Platform

A real-time platform for tracking and visualizing asset telemetry. Monitor simulated aircraft and vehicles on an interactive map with live data streaming.

## What is this?

This project demonstrates a complete tracking system with:
- **Backend API** — Real-time data streaming via SignalR and message queuing with RabbitMQ
- **Web Dashboard** — Interactive map (Cesium) showing asset locations and telemetry
- **Asset Simulator** — Generates realistic telemetry data for testing and demonstration

## Quick Start

### Prerequisites

Choose your setup approach:

**Option A: Docker (Recommended)**
- Docker and Docker Compose

**Option B: Local Development**
- .NET SDK 8+
- Node.js and npm
- RabbitMQ (optional, simulator can run without it)

### Option A: Docker Setup (Fastest)

```bash
cd backend
docker compose up --build
```

Then open:
- **Web App**: http://localhost:5073 (Angular frontend)
- **API**: http://localhost:5073/hubs/telemetry
- **RabbitMQ Admin**: http://localhost:15672 (user: `rabbitmq`, password: `rabbitmq`)

### Option B: Local Development

**1. Start the backend**
```bash
cd backend/Api
dotnet restore
dotnet build
dotnet run
```
API runs at http://localhost:5073

**2. Start the frontend** (in new terminal)
```bash
cd frontend/critical-asset-frontend
npm install
npm start
```
App opens at http://localhost:4200

**3. Start the simulator** (in new terminal)
```bash
cd simulator/CriticalAssetSimulator
dotnet run
```

## Project Structure

```
critical-asset-tracking-platform/
├── backend/                    # ASP.NET Core API
│   ├── Api/                   # API and SignalR hub
│   ├── Application/           # Business logic
│   ├── Infrastructure/        # RabbitMQ messaging
│   └── Domain/                # Core models
├── frontend/                  # Angular web app
│   └── critical-asset-frontend/
│       ├── src/
│       │   ├── app/          # Components and services
│       │   └── assets/       # Cesium maps library
│       └── package.json
└── simulator/                 # Asset simulator
    └── CriticalAssetSimulator/
```

## How It Works

1. **Simulator** generates telemetry (location, speed, altitude)
2. **Backend** receives data via RabbitMQ and broadcasts to clients
3. **Frontend** displays real-time data on an interactive map

## Configuration

### Simulator Config
Edit `simulator/CriticalAssetSimulator/config.json`:
```json
{
  "simulation": {
    "assetTypeCounts": {
      "Aircraft": 2,
      "LandVehicle": 1
    },
    "updateIntervalMs": 1000,
    "latitude": 39.0,
    "longitude": 35.0,
    "AltitudeMeters": 10000
  },
  "output": {
    "Type": "RabbitMQ"
  }
}
```

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
