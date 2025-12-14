Simulator config changes

The simulator now supports configuring assets by type using the `assetTypeCounts` object inside `config.json`.

Example:

```json
"simulation": {
  "assetTypeCounts": {
    "Aircraft": 2,
    "LandVehicle": 1
  },
  "updateIntervalMs": 1000,
  "pointIntervalSec": 2,
  "latitude": 39.0,
  "longitude": 35.0,
  "AltitudeMeters": 10000,
  "SpeedMetersPerSecond": 230,
  "HeadingDegrees": 90.0
}
```

When `assetTypeCounts` is present it takes precedence over the legacy `assetCount` setting. Shared simulation defaults (latitude, longitude, altitude, speed, heading, update intervals) are applied to all assets.
