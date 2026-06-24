namespace CriticalAssetTracking.Application.Dtos
{
    public record UpdateGeofenceRequestDto(
        string Name,
        string Description,
        List<CoordinateDto> Coordinates,
        bool AlertOnEntry,
        bool AlertOnExit,
        bool IsActive
    );
}
