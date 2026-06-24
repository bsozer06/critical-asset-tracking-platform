using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace CriticalAssetTracking.Infrastructure.Persistance.Repositories
{
    public class GeofenceRepository : IGeofenceRepository
    {
        private readonly ApplicationDbContext _context;

        public GeofenceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Geofence>> GetIntersectingGeofencesAsync(Point point)
        {
            return await _context.Geofences
                .AsNoTracking()
                .Where(g => g.IsActive && g.Boundary.Intersects(point))
                .ToListAsync();
        }

        public async Task AddAsync(Geofence geofence)
        {
            await _context.Geofences.AddAsync(geofence);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Geofence>> GetAllAsync()
        {
            return await _context.Geofences
                .AsNoTracking()
                .OrderByDescending(g => g.CreatedAtUtc)
                .ToListAsync();
        }

        public async Task<Geofence?> GetByIdAsync(Guid id)
        {
            return await _context.Geofences
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == id);
        }

        public async Task DeleteAsync(Guid id)
        {
            var geofence = await _context.Geofences.FindAsync(id);
            if (geofence != null)
            {
                _context.Geofences.Remove(geofence);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateAsync(Geofence geofence)
        {
            _context.Geofences.Update(geofence);
            await _context.SaveChangesAsync();
        }
    }
}
