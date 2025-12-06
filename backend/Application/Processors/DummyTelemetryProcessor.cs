using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;

namespace CriticalAssetTracking.Application.Processors
{
    public class DummyTelemetryProcessor : ITelemetryProcessor
    {
        public Task ProcessAsync(
            TelemetryMessageContract message,
            CancellationToken ct = default)
        {
            Console.WriteLine(
                $"[Telemetry] {message.AssetId} @ {message.Latitude},{message.Longitude}");

            return Task.CompletedTask;
        }
    }
}
