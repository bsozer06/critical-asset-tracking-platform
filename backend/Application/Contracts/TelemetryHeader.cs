namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryHeader
    {
        public string Protocol { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public string AssetId { get; set; } = string.Empty;
        public DateTime TimestampUtc { get; set; }
        public string Classification { get; set; } = string.Empty;
    }
}
