# Asset Simulator

This tool generates realistic telemetry for assets and sends it to the backend. Anyone can use or contribute.

## Quick Start

```bash
dotnet run
```

## Configuration

Edit `config.json` to set asset types, counts, and output method (RabbitMQ, Console, UDP).

## Features

- Simulates movement for aircraft, vehicles, drones, and more
- Sends data with CRC32 checksums for integrity
- Supports multiple output modes

## Contributing

Feel free to suggest new asset types or movement patterns! Change output destinations in `Output.cs`.
# Asset Simulator

Generates realistic telemetry for assets and sends it to the backend.

## Quick Start

```bash
dotnet run
```

## Configuration

Edit `config.json` to set asset types, counts, and output method (RabbitMQ, Console, UDP).

## Features

- Simulates movement for aircraft, vehicles, drones, and more
- Sends data with CRC32 checksums for integrity
- Supports multiple output modes

## Contributing

Feel free to suggest new asset types or movement patterns!
- Change output destinations in `Output.cs`
