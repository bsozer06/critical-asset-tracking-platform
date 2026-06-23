# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Critical Asset Tracking Platform (CATP) — real-time tracking and 3D visualization of assets (vehicles, aircraft, drones). Three components: a .NET 9 backend API, an Angular 20 frontend with CesiumJS, and a .NET 9 simulator.

## Commands

### Backend (C#/.NET 9)
```bash
cd backend/Api && dotnet restore && dotnet build
cd backend/Api && dotnet run
cd backend && dotnet test
# Run a single test project
cd backend && dotnet test Application.Tests/  # adjust path to test project
```

### Frontend (Angular 20)
```bash
cd frontend/critical-asset-frontend && npm install
npm start                    # ng serve --open (http://localhost:4200)
npm run build
npm run lint                 # ng lint (ESLint + angular-eslint)
npm test                     # Karma/Jasmine in watch mode
npm run test:coverage        # ChromeHeadless, generates coverage/
```

### Simulator
```bash
cd simulator/CriticalAssetSimulator && dotnet run
```

### Docker (full stack)
```bash
cd backend && docker compose up --build
```
Services: API (`:5073`), RabbitMQ admin (`:15672`), Grafana (`:3000`), Prometheus (`:9090`), Postgres (`:5432`), Redis (`:6379`).

## Architecture

### Data Pipeline
```
Simulator → RabbitMQ (catp.exchange / catp.telemetry.queue)
         → TelemetryConsumer (CRC32 checksum validation, drops tampered messages)
         → TelemetryProcessor (publishes to SignalR + fires GeofenceEngine async)
         → SignalR Hub (/hubs/telemetry, event: "telemetry-received")
         → Angular frontend (SignalRService → CesiumMapComponent + TelemetryPanelComponent)
```

### Backend Layer Structure (`backend/`)
- **Domain** — `Entities/` (Geofence, GeofenceViolation), `Models/`, `ValueObjects/`. No external dependencies.
- **Application** — Business logic: `Processors/TelemetryProcessor.cs`, `Services/GeofenceEngine.cs`, `Interfaces/` (contracts), `Metrics/TelemetryMetrics.cs` (Prometheus counters/histograms), `Security/ChecksumCalculator.cs` (CRC32).
- **Infrastructure** — `Messaging/TelemetryConsumer.cs` (RabbitMQ consumer with CRC32 check), `Caching/GeofenceStateService.cs` (Redis), `Persistance/` (EF Core + PostGIS via NetTopologySuite), `Monitoring/` (Grafana + Prometheus config).
- **Api** — `Hubs/TelemetryHub.cs` (SignalR), `Controllers/GeofenceController.cs`, `BackgroundServices/TelemetryConsumerHostedService.cs`, `Adapters/SignalRTelemetryPublisher.cs`.

DI registration: `AddApplication()` in `Application/DependencyInjection.cs`, `AddInfrastructure()` in `Infrastructure/DependencyInjection.cs`.

### Geofence Engine
`GeofenceEngine` (Application layer) uses NetTopologySuite for polygon containment checks. Asset position state (which geofences each asset is inside) is stored in Redis via `IGeofenceStateService`. Entry/Exit events are detected by diffing previous vs. current geofence membership, then persisted via `IViolationRepository`. Geofence boundary polygons use SRID 4326 (WGS84).

### Security: CRC32 Integrity
Every telemetry envelope includes an `integrity.checksum` field. `TelemetryConsumer` recomputes CRC32 over the raw JSON `"message"` element and drops (acks without processing) any message where hashes don't match. Failures are counted in `TelemetryMetrics.ChecksumValidationFailures`.

### Frontend Structure (`frontend/critical-asset-frontend/src/app/`)
- **Services**: `SignalRService` (hub connection, `telemetry$` BehaviorSubject), `CesiumViewerService` (singleton Cesium.Viewer holder shared across components), `GeofenceService` (REST calls to backend).
- **Components**: `CesiumMapComponent` (3D globe, renders asset entities), `TelemetryPanelComponent` (card list), `GeofencePanelComponent` (draw/manage geofences), `GeofenceAlertComponent`, `ConnectionStatusBadgeComponent`.
- `App` (root component) orchestrates SignalR connection startup and wires geofence violations/alerts.
- Cesium Ion token and SignalR hub URL are configured in `src/environments/environment.ts`.

### Observability
Prometheus metrics are exposed via `app.UseMetricServer()` (prometheus-net). Grafana provisioning config lives in `backend/Infrastructure/Monitoring/Dashboards/Grafana/provisioning/`. Key metrics: `catp_telemetry_messages_processed_total`, `catp_telemetry_processing_duration_seconds`, `catp_checksum_validation_failures_total`, `catp_signalr_connections_active`.

## Configuration

| File | Key settings |
|---|---|
| `backend/Api/appsettings.Development.json` | RabbitMQ connection, Postgres connection string, Redis connection string |
| `simulator/CriticalAssetSimulator/config.json` | Asset counts, starting location, output type |
| `frontend/.../src/environments/environment.ts` | `signalRHubUrl`, Cesium Ion token |

In Docker, settings are injected as environment variables (e.g., `RabbitMq__HostName`, `ConnectionStrings__DefaultConnection`).

## Database

Postgres with PostGIS extension (`postgis/postgis:15-3.3` image). EF Core migrations run automatically on startup with retry logic (5 attempts, 5s delay). Seed data (a default Ankara geofence) is inserted if the `Geofences` table is empty. Add new migrations from `backend/`:
```bash
dotnet ef migrations add <Name> --project Infrastructure --startup-project Api
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main` and `develop`:
- **backend**: `dotnet restore` → `dotnet build --configuration Release` → `dotnet test`
- **frontend**: `npm ci` → `npm run lint` → `npm run build` → `npm run test:coverage`
- **simulator**: `dotnet restore` → `dotnet build --configuration Release`
