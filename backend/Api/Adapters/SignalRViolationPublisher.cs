using CriticalAssetTracking.Api.Hubs;
using CriticalAssetTracking.Application.Dtos;
using CriticalAssetTracking.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace CriticalAssetTracking.Api.Adapters
{
    public class SignalRViolationPublisher : IViolationPublisher
    {
        private readonly IHubContext<TelemetryHub> _hub;

        public SignalRViolationPublisher(IHubContext<TelemetryHub> hub)
        {
            _hub = hub;
        }

        public async Task PublishAsync(GeofenceViolationDto violation, CancellationToken ct = default)
        {
            await _hub.Clients.All.SendAsync("violation-detected", violation, ct);
        }
    }
}
