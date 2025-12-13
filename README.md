# Critical Asset Tracking Platform (CATP)

A minimal end-to-end platform for tracking telemetry from simulated assets using RabbitMQ, ASP.NET Core backend (SignalR), an Angular/Cesium frontend, and a simulator that emits telemetry.

Repository layout
- backend/ — ASP.NET Core backend with SignalR hub and RabbitMQ consumer.
  - [`CriticalAssetTracking.Api.Program`](backend/Api/Program.cs)
  - [`CriticalAssetTracking.Api.BackgroundServices.TelemetryConsumerHostedService`](backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs)
  - [`CriticalAssetTracking.Infrastructure.Messaging.TelemetryConsumer`](backend/Infrastructure/Messaging/TelemetryConsumer.cs)
  - [`CriticalAssetTracking.Application.Processors.TelemetryProcessor`](backend/Application/Processors/TelemetryProcessor.cs)
  - [`CriticalAssetTracking.Application.Security.ChecksumCalculator`](backend/Application/Security/ChecksumCalculator.cs)
  - [`CriticalAssetTracking.Api.Settings.RabbitMqSettings`](backend/Api/Settings/RabbitMqSettings.cs)
  - [`backend/CriticalAssetTracking.sln`](backend/CriticalAssetTracking.sln)

- frontend/ — Angular UI with Cesium map and telemetry panel
  - App entry: [`src/main.ts`](frontend/critical-asset-frontend/src/main.ts)
  - Map component: [`CesiumMapComponent`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts)
  - Telemetry list/UX: [`TelemetryPanelComponent`](frontend/critical-asset-frontend/src/app/components/telemetry-panel/telemetry-panel.component.ts)
  - Cesium assets (Workers/widgets): [`src/assets/cesium/`](frontend/critical-asset-frontend/src/assets/cesium/)
  - Environment / Cesium config: [`src/environments/environment.ts`](frontend/critical-asset-frontend/src/environments/environment.ts)

- simulator/ — Small simulator that produces telemetry messages and outputs via console/UDP/RabbitMQ
  - Entrypoint: [`simulator/CriticalAssetSimulator/Program.cs`](simulator/CriticalAssetSimulator/Program.cs)
  - Message builder: [`simulator/CriticalAssetSimulator/Message.cs`](simulator/CriticalAssetSimulator/Message.cs)
  - Config classes: [`simulator/CriticalAssetSimulator/Config.cs`](simulator/CriticalAssetSimulator/Config.cs)
  - Output adapters: [`simulator/CriticalAssetSimulator/Output.cs`](simulator/CriticalAssetSimulator/Output.cs)

Quick start (local development)

Prerequisites
- .NET SDK 8+ (for backend and simulator)
- Node.js + npm (for frontend)
- Angular CLI (optional, use local npm scripts)
- RabbitMQ (optional for RabbitMQ output; simulator can also emit to console/UDP)

1) Start RabbitMQ (optional)
- Default settings are in [`backend/Api/Settings/RabbitMqSettings.cs`](backend/Api/Settings/RabbitMqSettings.cs) (host `localhost`, port `5673`, exchange `catp.exchange`, queue `catp.telemetry.queue`). If you use a normal RabbitMQ install, you may need to update the `Port` or `VHost`.

2) Run the backend (SignalR + RabbitMQ consumer)
```bash
cd backend/Api
dotnet restore
dotnet build
dotnet run
```
- The SignalR hub is registered at `/hubs/telemetry` (`Program.cs` maps hub at `/hubs/telemetry`) — see [`CriticalAssetTracking.Api.Hubs.TelemetryHub`](backend/Api/Hubs/TelemetryHub.cs).
- The RabbitMQ background consumer is implemented by [`CriticalAssetTracking.Api.BackgroundServices.TelemetryConsumerHostedService`](backend/Api/BackgroundServices/TelemetryConsumerHostedService.cs) and uses [`CriticalAssetTracking.Infrastructure.Messaging.TelemetryConsumer`](backend/Infrastructure/Messaging/TelemetryConsumer.cs) to receive messages and pass them to the registered [`CriticalAssetTracking.Application.Processors.TelemetryProcessor`](backend/Application/Processors/TelemetryProcessor.cs).

3) Run the frontend (Angular + Cesium)
```bash
cd frontend/critical-asset-frontend
npm install
ng serve
# or:
npm run start
```
- Frontend uses Cesium static assets in `src/assets/cesium` and sets `window.CESIUM_BASE_URL` via [`src/index.html`](frontend/critical-asset-frontend/src/index.html).
- `environment.ts` sets the default SignalR Hub URL to `http://localhost:5073/hubs/telemetry` — see [`frontend/critical-asset-frontend/src/environments/environment.ts`](frontend/critical-asset-frontend/src/environments/environment.ts).
- The map uses [`CesiumMapComponent`](frontend/critical-asset-frontend/src/app/components/cesium-map/cesium-map.component.ts) and receives telemetry via SignalR.

4) Run the simulator
```bash
cd simulator/CriticalAssetSimulator
dotnet run
```
- Configure the simulator via `config.json` (modelled by `simulator/CriticalAssetSimulator/Config.cs`) to send to RabbitMQ, UDP, or console.
- The simulator builds telemetry envelopes using [`simulator/CriticalAssetSimulator/Message.cs`](simulator/CriticalAssetSimulator/Message.cs) and computes CRC32 checksums which are validated by the backend (`[`CriticalAssetTracking.Application.Security.IntegrityValidator`](backend/Application/Security/IntegrityValidator.cs)` uses `ChecksumCalculator`).

Build & test
- Backend build/test:
```bash
cd backend
dotnet restore
dotnet build
dotnet test
```
- Frontend:
```bash
cd frontend/critical-asset-frontend
npm ci
ng test
ng e2e  # if e2e configured
```
- Simulator:
```bash
cd simulator
dotnet restore
dotnet build
dotnet run
```

Telemetry flow overview
- Simulator emits a telemetry envelope (message + integrity) using the message builder: [`simulator/CriticalAssetSimulator/Message.cs`](simulator/CriticalAssetSimulator/Message.cs).
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
