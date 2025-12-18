namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryMessage
    {
        public TelemetryHeader Header { get; set; } = default!;
        public TelemetryBody Body { get; set; } = default!;
    }
}
