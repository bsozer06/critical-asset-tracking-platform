using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Infrastructure.Persistance.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
namespace CriticalAssetTracking.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString, x =>
                {
                    x.UseNetTopologySuite();
                    x.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

            services.AddScoped<IGeofenceRepository, GeofenceRepository>();
            services.AddScoped<IViolationRepository, ViolationRepository>();

            return services;
        }
    }
}
