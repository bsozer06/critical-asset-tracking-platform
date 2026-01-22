using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Domain.Entities
{
    public class Geofence
    {

        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public Geometry Boundary { get; set; }

        public bool AlertOnEntry { get; set; }
        public bool AlertOnExit { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAtUtc { get; set; }

        //public Guid Id { get; set; }
        //public string Name { get; set; }
        //public Geometry Boundary { get; set; }
        //public bool AlertOnEntry { get; set; }
        //public bool AlertOnExit { get; set; }
        //public bool IsActive { get; set; }
    }
}
