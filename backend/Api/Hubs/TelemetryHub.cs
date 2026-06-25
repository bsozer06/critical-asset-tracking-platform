using CriticalAssetTracking.Application.Metrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CriticalAssetTracking.Api.Hubs
{
    [Authorize]
    public class TelemetryHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            TelemetryMetrics.ActiveSignalRConnections.Inc();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            TelemetryMetrics.ActiveSignalRConnections.Dec();
            await base.OnDisconnectedAsync(exception);
        }
    }
}