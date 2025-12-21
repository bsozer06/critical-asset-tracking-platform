# Backend API

ASP.NET Core backend with real-time data streaming via SignalR, RabbitMQ message queue integration, and comprehensive monitoring.

## Quick Start

### With Docker (Recommended)

```bash
docker compose up --build
```

- **API**: http://localhost:5073
- **RabbitMQ Admin**: http://localhost:15672 (user: `rabbitmq`, password: `rabbitmq`)
- **Grafana Dashboard**: http://localhost:3000 (user: `admin`, password: `admin`)
- **Prometheus Metrics**: http://localhost:9090
- **API Metrics Endpoint**: http://localhost:5073/metrics

### Local Development

```bash
cd Api
dotnet run
```

API runs at http://localhost:5073

## What's Inside

- **SignalR Hub** (`Api/Hubs/TelemetryHub.cs`) — Broadcasts telemetry to connected clients in real-time
- **RabbitMQ Consumer** (`Api/BackgroundServices/TelemetryConsumerHostedService.cs`) — Listens for messages and streams them to clients
- **Security** (`Application/Security/ChecksumCalculator.cs`) — Validates message integrity with CRC32 checksums
- **Metrics Collection** (`Application/Metrics/TelemetryMetrics.cs`) — Tracks system performance and health
- **Monitoring Stack** — Prometheus + Grafana for observability

## Monitoring & Metrics

The platform provides comprehensive monitoring out of the box:

### 🏥 Health Checks

Health endpoints for monitoring system status:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Full health status with all checks |
| `GET /health/live` | Liveness probe (is app running?) |
| `GET /health/ready` | Readiness probe (can accept traffic?) |

**Checks included:**
- **RabbitMQ** — Message broker connection status
- **Simulator** — Telemetry stream activity (healthy if messages received in last 30s)

Example response:
```json
{
  "status": "Healthy",
  "checks": [
    { "name": "rabbitmq", "status": "Healthy" },
    { "name": "simulator", "status": "Healthy", "data": { "messageCount": 1523 } }
  ]
}
```

### 📊 Available Metrics
- **Message Processing Rate** — How many telemetry messages processed per second
- **Processing Duration** — Time taken to process each message
- **Active Connections** — Number of real-time SignalR connections
- **Validation Failures** — Count of checksum validation errors

### 📈 Grafana Dashboard
Access the monitoring dashboard at http://localhost:3000:
- Real-time charts for all metrics
- Visual alerts and health indicators
- Organized by asset type (aircraft, drone, landvehicle)

### 🔍 Prometheus Metrics
Raw metrics available at:
- **API endpoint**: http://localhost:5073/metrics
- **Prometheus UI**: http://localhost:9090

## Configuration

For local Docker development, settings are in `appsettings.Development.json` and `docker-compose.yml`.

```bash
RabbitMq__Host=rabbitmq
RabbitMq__Port=5672
RabbitMq__Username=rabbitmq
RabbitMq__Password=rabbitmq
```

## Testing

```bash
dotnet test
```

## Architecture

```
Api/
├── Program.cs                 # Startup configuration + metrics middleware
├── Hubs/TelemetryHub.cs      # Real-time client connections
├── Controllers/               # REST endpoints
│   └── HealthController.cs   # Health check endpoints
├── HealthChecks/              # Custom health checks
│   └── TelemetryStreamHealthCheck.cs  # Simulator monitoring
├── BackgroundServices/        # Message queue consumer
└── Settings/                  # Configuration models

Application/
├── Processors/                # Business logic with metrics tracking
├── Security/                  # Checksum validation
├── Metrics/                   # Prometheus metrics definitions
└── Interfaces/                # Abstractions

Infrastructure/
├── Messaging/                 # RabbitMQ implementation
├── Monitoring/                # Observability infrastructure
│   ├── Dashboards/Grafana/   # Grafana configuration
│   └── Metrics/Prometheus/   # Prometheus configuration
└── Settings/                  # Infrastructure settings

Domain/
└── Models/                    # Core data models
```

## How It Works

1. **Simulator** sends telemetry messages to RabbitMQ
2. **Backend consumer** reads messages from the queue and validates them
3. **Metrics collection** tracks performance during processing
4. **SignalR hub** broadcasts validated data to connected clients
5. **Monitoring stack** provides observability through dashboards

## Contributing

Open to all! Please:
- Add tests for your changes
- Consider metrics impact for new features
- Update monitoring dashboards if needed
