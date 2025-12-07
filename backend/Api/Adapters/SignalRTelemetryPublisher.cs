using CriticalAssetTracking.Api.Hubs;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Models;
using Microsoft.AspNetCore.SignalR;

namespace CriticalAssetTracking.Api.Adapters
{
    public class SignalRTelemetryPublisher : ITelemetryPublisher
    {
        private readonly IHubContext<TelemetryHub> _hub;

        public SignalRTelemetryPublisher(IHubContext<TelemetryHub> hub)
        {
            _hub = hub;
        }

        public async Task PublishAsync(TelemetryPoint telemetry, CancellationToken ct)
        {
            await _hub.Clients.All.SendAsync(
                "telemetry-received",
                telemetry,
                ct);
        }
    }
}
