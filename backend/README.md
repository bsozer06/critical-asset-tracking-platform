# Backend API

ASP.NET Core backend with real-time data streaming via SignalR and RabbitMQ message queue integration.

## Quick Start

### With Docker (Recommended)

```bash
docker compose up --build
```

- **API**: http://localhost:5073
- **RabbitMQ Admin**: http://localhost:15672 (user: `rabbitmq`, password: `rabbitmq`)

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

## Configuration
- **SignalR hub URL**
- **Exchange and queue names**

For local Docker development, settings are in `appsettings.Development.json` and `docker-compose.yml`.


```
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
├── Program.cs                 # Startup configuration
├── Hubs/TelemetryHub.cs      # Real-time client connections
├── Controllers/               # REST endpoints
├── BackgroundServices/        # Message queue consumer
└── Settings/                  # Configuration models

Application/
├── Processors/                # Business logic
├── Security/                  # Checksum validation
└── Interfaces/                # Abstractions

Infrastructure/
├── Messaging/                 # RabbitMQ implementation
└── obj/                       # Build artifacts

Domain/
└── Models/                    # Core data models
```

## How It Works

1. Simulator sends telemetry messages to RabbitMQ
2. Backend consumer reads messages from the queue
# Backend API

Handles real-time telemetry, data validation, and streaming to the frontend.

## Quick Start

cd Api
dotnet restore
dotnet build
dotnet run
```
Runs at http://localhost:5073

## Features

- Receives telemetry from simulator or external sources
- Validates data with CRC32 checksums
- Integrates with RabbitMQ for message queuing

## Configuration

Open to all! Please add tests for your changes.
