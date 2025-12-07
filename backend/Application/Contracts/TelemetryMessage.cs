using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CriticalAssetTracking.Application.Contracts
{
    public class TelemetryMessage
    {
        public TelemetryHeader Header { get; set; } = default!;
        public TelemetryBody Body { get; set; } = default!;
    }
}
