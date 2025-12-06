using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CriticalAssetTracking.Domain.Models
{
    public record TelemetryPoint
     (
         string AssetId,
         DateTime TimestampUtc,
         double Latitude,
         double Longitude,
         double AltitudeMeters,
         double SpeedMetersPerSecond,
         double HeadingDegrees
     );
}
