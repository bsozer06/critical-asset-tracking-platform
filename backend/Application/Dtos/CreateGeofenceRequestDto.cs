namespace CriticalAssetTracking.Application.Dtos
{
    public record CreateGeofenceRequestDto(
        string Name,
        string Description,
        List<CoordinateDto> Coordinates,
        bool AlertOnEntry = true,
        bool AlertOnExit = true
    );

    public record CoordinateDto(double Latitude, double Longitude);
}
