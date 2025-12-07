using CriticalAssetTracking.Domain.Models;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface ITelemetryPublisher
    {
        Task PublishAsync(TelemetryPoint telemetry, CancellationToken ct);
    }
}
