using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;

namespace CriticalAssetTracking.Application.Processors
{
    public class DummyTelemetryProcessor : ITelemetryProcessor
    {
        public Task ProcessAsync(
            TelemetryEnvelope envelope,
            CancellationToken ct = default)
        {
            var header = envelope.Message.Header;
            var body = envelope.Message.Body;

            Console.WriteLine($"[Telemetry] {header.AssetId} @ {body.Latitude},{body.Longitude}");
            Console.WriteLine($" classification={header.Classification} checksum={envelope.Integrity.Checksum}");

            return Task.CompletedTask;
        }
    }
}
