namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryEnvelope
    {
        public TelemetryMessage Message { get; set; } = default!;
        public IntegrityBlock Integrity { get; set; } = default!;
    }
}
