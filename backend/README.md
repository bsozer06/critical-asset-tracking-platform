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
dotnet restore
dotnet build
dotnet run
```

API runs at http://localhost:5073

## What's Inside

- **SignalR Hub** (`Api/Hubs/TelemetryHub.cs`) — Broadcasts telemetry to connected clients in real-time
- **RabbitMQ Consumer** (`Api/BackgroundServices/TelemetryConsumerHostedService.cs`) — Listens for messages and streams them to clients
- **Telemetry Processor** (`Application/Processors/TelemetryProcessor.cs`) — Processes and validates incoming data
- **Security** (`Application/Security/ChecksumCalculator.cs`) — Validates message integrity with CRC32 checksums

## Configuration

Edit `Api/appsettings.json` to configure:

- **RabbitMQ host and port**
- **SignalR hub URL**
- **Exchange and queue names**

For local Docker development, settings are in `appsettings.Development.json` and `docker-compose.yml`.

## Environment Variables

If running in Docker, these environment variables override settings files:

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
3. Processor validates data integrity
4. SignalR broadcasts to all connected web clients
5. Frontend receives updates in real-time

## Next Steps

- Customize telemetry processing in `Application/Processors/`
- Add new REST endpoints in `Api/Controllers/`
- Modify SignalR methods in `Api/Hubs/TelemetryHub.cs`
- Deploy to cloud by updating `docker-compose.yml`
