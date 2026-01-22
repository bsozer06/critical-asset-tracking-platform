using CriticalAssetTracking.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CriticalAssetTracking.Infrastructure.Persistance.Repositories
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }

        public DbSet<Geofence> Geofences { get; set; }
        public DbSet<GeofenceViolation> GeofenceViolations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<Geofence>(entity =>
            {
                entity.ToTable("Geofences");
                entity.HasKey(e => e.Id);

                // Defining Spatial Index (GIST) 
                entity.HasIndex(e => e.Boundary)
                      .HasMethod("gist");
                entity.Property(e => e.Boundary)
                      .HasColumnType("geometry(Polygon, 4326)");
            });

            modelBuilder.Entity<GeofenceViolation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Location).HasMethod("gist");
                entity.Property(e => e.Location)
                      .HasColumnType("geometry(Point, 4326)");

                // Connection with Geofence 
                entity.HasOne(v => v.Geofence)
                      .WithMany()
                      .HasForeignKey(v => v.GeofenceId);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
