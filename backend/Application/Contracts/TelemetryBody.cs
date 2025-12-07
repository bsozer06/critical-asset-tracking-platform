namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryBody
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double AltitudeMeters { get; set; }
        public double SpeedMps { get; set; }
        public double HeadingDeg { get; set; }
    }
}
