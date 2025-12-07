using System.Text.Json.Serialization;

namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryEnvelope
    {
        public TelemetryMessage Message { get; set; } = default!;
        public IntegrityBlock Integrity { get; set; } = default!;
    }

    public class TelemetryMessage
    {
        public TelemetryHeader Header { get; set; } = default!;
        public TelemetryBody Body { get; set; } = default!;
    }

    public class TelemetryHeader
    {
        public string Protocol { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string AssetId { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public string Classification { get; set; } = string.Empty;
    }

    public class TelemetryBody
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double AltitudeMeters { get; set; }
        public double SpeedMps { get; set; }
        public double HeadingDeg { get; set; }
    }

    public class IntegrityBlock
    {
        public string Checksum { get; set; } = string.Empty;
    }

}
