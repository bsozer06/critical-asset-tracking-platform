using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CriticalAssetTracking.Domain.Models
{
    // Redis cache için sadeleştirilmiş DTO
    public class GeofenceCacheDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string BoundaryWkt { get; set; } = string.Empty;
        public bool AlertOnEntry { get; set; }
        public bool AlertOnExit { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
