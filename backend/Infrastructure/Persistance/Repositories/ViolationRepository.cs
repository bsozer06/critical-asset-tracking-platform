using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CriticalAssetTracking.Infrastructure.Persistance.Repositories
{
    public class ViolationRepository : IViolationRepository
    {
        private readonly ApplicationDbContext _context;

        public ViolationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(GeofenceViolation violation)
        {
            if (violation.Location != null && violation.Location.SRID == 0)
            {
                violation.Location.SRID = 4326;
            }

            await _context.GeofenceViolations.AddAsync(violation);
            await _context.SaveChangesAsync();
        }

        public async Task<List<GeofenceViolation>> GetHistoryByAssetIdAsync(string assetId, int limit = 100)
        {
            return await _context.GeofenceViolations
                .Where(v => v.AssetId == assetId)
                .OrderByDescending(v => v.TimestampUtc)
                .Take(limit)
                .Include(v => v.Geofence) // We join to see which region the violation occurred in.
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
