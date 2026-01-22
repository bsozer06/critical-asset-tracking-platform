using CriticalAssetTracking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CriticalAssetTracking.Infrastructure.Persistance.Configurations
{
    public class GeofenceConfiguration
    {
        public void Configure(EntityTypeBuilder<Geofence> builder)
        {
            builder.HasKey(x => x.Id);
            // We tell PostGIS, "we need a geographic column and a spatial index."
            builder.Property(x => x.Boundary)
                   .HasColumnType("geometry(Polygon, 4326)"); // 4326: WGS84 coordinate system
        }
    }
}
