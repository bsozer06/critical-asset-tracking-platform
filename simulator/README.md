# Asset Simulator

Generates realistic telemetry data for tracked assets (aircraft, vehicles, etc.) and sends it to the backend via RabbitMQ.

## Quick Start

### With Docker

The simulator runs automatically in Docker Compose as part of the full platform:

```bash
cd backend
docker compose up --build
```

### Local Development

```bash
cd CriticalAssetSimulator
dotnet restore
dotnet build
dotnet run
```

## Configuration

Edit `config.json` to customize the simulation:

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
    "AltitudeMeters": 10000,
    "SpeedMetersPerSecond": 230,
    "HeadingDegrees": 90.0
  },
  "output": {
    "Type": "RabbitMQ"
  },
  "rabbitMq": {
    "Host": "localhost",
    "Port": 5672,
    "Username": "rabbitmq",
    "Password": "rabbitmq",
    "Exchange": "catp.exchange",
    "Queue": "catp.telemetry.queue"
  }
}
```

### Configuration Options

| Setting | Description |
|---------|-------------|
| `assetTypeCounts` | Number of each asset type to simulate (Aircraft, LandVehicle, etc.) |
| `updateIntervalMs` | How often to update telemetry (milliseconds) |
| `latitude`, `longitude` | Starting coordinates |
| `AltitudeMeters` | Starting altitude |
| `SpeedMetersPerSecond` | Movement speed |
| `HeadingDegrees` | Direction (0-360°) |
| `Type` | Output method: `RabbitMQ`, `Console`, or `UDP` |

## What It Generates

Each asset produces telemetry with:
- **Location** (latitude, longitude, altitude)
- **Motion** (speed, heading)
- **Timestamp**
- **CRC32 Checksum** (for data integrity validation)

The simulator automatically computes checksums and validates data consistency before sending to the backend.

## Asset Types

- `Aircraft` — High-altitude fast movement
- `LandVehicle` — Ground-level slower movement
- Custom types can be added in `Models.cs`

## Output Modes

### RabbitMQ (Default)
Messages are sent to a RabbitMQ queue and consumed by the backend.

### Console
Prints telemetry to the console (useful for debugging).

### UDP
Sends raw data packets to a UDP endpoint (for custom consumers).

## Next Steps

- Modify `Simulator.cs` to change movement patterns
- Add new asset types in `Models.cs`
- Customize the message format in `Message.cs`
- Change output destinations in `Output.cs`
