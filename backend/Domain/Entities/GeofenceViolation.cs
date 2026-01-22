using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Domain.Entities
{
    public class GeofenceViolation
    {
        public Guid Id { get; set; }
        public string AssetId { get; set; }
        public Guid GeofenceId { get; set; }

        // 'ENTRY' or 'EXIT'
        public string ViolationType { get; set; }

        public Point Location { get; set; }

        public DateTime TimestampUtc { get; set; }

        // Navigation property
        public Geofence Geofence { get; set; }
    }
}
