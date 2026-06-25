using CriticalAssetTracking.Domain.Entities;
using CriticalAssetTracking.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CriticalAssetTracking.Infrastructure.Persistance.Repositories
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }

        public DbSet<Geofence> Geofences { get; set; }
        public DbSet<GeofenceViolation> GeofenceViolations { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<Geofence>(entity =>
            {
                entity.ToTable("Geofences");
                entity.HasKey(e => e.Id);

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

                entity.HasOne(v => v.Geofence)
                      .WithMany()
                      .HasForeignKey(v => v.GeofenceId);
            });

            // Identity tables must be configured by base first
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId);
            });
        }
    }
}
