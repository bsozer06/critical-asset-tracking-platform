using CriticalAssetTracking.Api.Adapters;
using CriticalAssetTracking.Api.BackgroundServices;
using CriticalAssetTracking.Api.HealthChecks;
using CriticalAssetTracking.Api.Hubs;
using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application;
using CriticalAssetTracking.Infrastructure;
using CriticalAssetTracking.Infrastructure.Auth;
using CriticalAssetTracking.Infrastructure.Persistance.Repositories;
using CriticalAssetTracking.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Prometheus;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddScoped<ITelemetryPublisher, SignalRTelemetryPublisher>();
builder.Services.AddScoped<IViolationPublisher, SignalRViolationPublisher>();
builder.Services.AddHostedService<TelemetryConsumerHostedService>();
builder.Services.Configure<RabbitMqSettings>(
    builder.Configuration.GetSection("RabbitMq"));

// Health Checks
var rabbitMqSettings = builder.Configuration.GetSection("RabbitMq").Get<RabbitMqSettings>() ?? new RabbitMqSettings();
builder.Services.AddHealthChecks()
    .AddRabbitMQ(async sp =>
    {
        var factory = new ConnectionFactory
        {
            HostName = rabbitMqSettings.HostName,
            Port = rabbitMqSettings.Port,
            UserName = rabbitMqSettings.UserName,
            Password = rabbitMqSettings.Password,
            VirtualHost = rabbitMqSettings.VHost ?? "/"
        };
        return await factory.CreateConnectionAsync();
    }, name: "rabbitmq", tags: ["messaging", "rabbitmq"])
    .AddCheck<TelemetryStreamHealthCheck>("simulator", tags: ["telemetry", "simulator"]);

//builder.Services.AddSingleton<ITelemetryProcessor, DummyTelemetryProcessor>();
//builder.Services.AddScoped<ITelemetryProcessor, TelemetryProcessor>();


builder.Services.AddControllers().AddJsonOptions(options =>
{
    // NetTopologySuite automatically converts geometries to GeoJSON.
    options.JsonSerializerOptions.Converters.Add(new NetTopologySuite.IO.Converters.GeoJsonConverterFactory());
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

// Add Prometheus metrics endpoint
app.UseMetricServer();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<TelemetryHub>("/hubs/telemetry");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<ApplicationDbContext>();

    int retryCount = 0;
    while (retryCount < 5)
    {
        try
        {
            logger.LogInformation("Connecting to database and applying migrations... (Attempt: {Count})", retryCount + 1);

            context.Database.Migrate();

            // Seed geofence data
            if (!context.Geofences.Any())
            {
                var gf = new NetTopologySuite.Geometries.GeometryFactory(new NetTopologySuite.Geometries.PrecisionModel(), 4326);
                context.Geofences.Add(new Geofence
                {
                    Id = Guid.NewGuid(),
                    Name = "Ankara Test Bolgesi",
                    Description = "Docker Seed Data",
                    IsActive = true,
                    Boundary = gf.CreatePolygon(new[]
                    {
                        new NetTopologySuite.Geometries.Coordinate(32.7, 39.8),
                        new NetTopologySuite.Geometries.Coordinate(33.1, 39.8),
                        new NetTopologySuite.Geometries.Coordinate(33.1, 40.2),
                        new NetTopologySuite.Geometries.Coordinate(32.7, 40.2),
                        new NetTopologySuite.Geometries.Coordinate(32.7, 39.8)
                    })
                });
                context.SaveChanges();
                logger.LogInformation("Geofence seed data added.");
            }

            // Seed admin user and roles
            await AdminSeeder.SeedAsync(services, app.Configuration);

            break;
        }
        catch (Exception ex)
        {
            retryCount++;
            logger.LogWarning("Database not ready, retrying... (Error: {Message})", ex.Message);
            Thread.Sleep(5000);
        }
    }
}

app.Run();