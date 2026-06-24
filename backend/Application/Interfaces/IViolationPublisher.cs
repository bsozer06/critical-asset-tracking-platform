using CriticalAssetTracking.Application.Dtos;

namespace CriticalAssetTracking.Application.Interfaces
{
    public interface IViolationPublisher
    {
        Task PublishAsync(GeofenceViolationDto violation, CancellationToken ct = default);
    }
}
