namespace CriticalAssetTracking.Domain.Models
{
    public class Asset
    {
        public string AssetId { get; init; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double AltitudeMeters { get; set; }

        // movement properties (domain-level)
        public double SpeedMetersPerSecond { get; set; }
        public double HeadingDegrees { get; set; }
    }
}
