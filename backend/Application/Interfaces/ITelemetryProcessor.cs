using CriticalAssetTracking.Application.Contracts;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface ITelemetryProcessor
    {
        /// <summary>
        /// Process incoming telemetry contract from RabbitMQ:
        /// validate + transform to DTO + forward to consumers (SignalR etc).
        /// </summary>
        Task ProcessAsync(TelemetryMessageContract message, CancellationToken ct = default);
    }
}
