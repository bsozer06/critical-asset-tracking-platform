using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Dtos;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface IGeofenceEngine
    {
        Task ProcessTelemetryAsync(TelemetryMessageDto telemetry);
    }
}
