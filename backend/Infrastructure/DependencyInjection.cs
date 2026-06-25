using System.Text;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Infrastructure.Auth;
using CriticalAssetTracking.Infrastructure.Caching;
using CriticalAssetTracking.Infrastructure.Identity;
using CriticalAssetTracking.Infrastructure.Persistance.Repositories;
using CriticalAssetTracking.Infrastructure.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace CriticalAssetTracking.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            var redisConnection =
                Environment.GetEnvironmentVariable("REDIS_URL")
                ?? configuration["Redis:ConnectionString"]
                ?? configuration.GetConnectionString("RedisConnection");

            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnection;
                options.InstanceName = "CATP_";
            });

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString, x =>
                {
                    x.UseNetTopologySuite();
                    x.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                }));

            services.AddScoped<IGeofenceRepository, GeofenceRepository>();
            services.AddScoped<IViolationRepository, ViolationRepository>();
            services.AddScoped<IGeofenceStateService, GeofenceStateService>();

            // JWT settings
            services.Configure<JwtSettings>(configuration.GetSection("Jwt"));
            var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>()!;

            // ASP.NET Core Identity
            services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // JWT Bearer authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                // SignalR sends JWT via query string because WebSocket doesn't support headers
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) &&
                            path.StartsWithSegments("/hubs/telemetry"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            services.AddHttpContextAccessor();
            services.AddScoped<IAuthService, AuthService>();

            return services;
        }
    }
}
