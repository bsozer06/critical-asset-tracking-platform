using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Processors;
using CriticalAssetTracking.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CriticalAssetTracking.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IGeofenceEngine, GeofenceEngine>();
            services.AddScoped<ITelemetryProcessor, TelemetryProcessor>();

            return services;
        }
    }
}
