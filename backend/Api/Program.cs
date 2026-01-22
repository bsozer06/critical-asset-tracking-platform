using CriticalAssetTracking.Api.Adapters;
using CriticalAssetTracking.Api.BackgroundServices;
using CriticalAssetTracking.Api.HealthChecks;
using CriticalAssetTracking.Api.Hubs;
using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application;
using CriticalAssetTracking.Infrastructure;
using Prometheus;
using RabbitMQ.Client;
using CriticalAssetTracking.Infrastructure.Persistance.Repositories;
using Microsoft.EntityFrameworkCore;
using CriticalAssetTracking.Domain.Entities;

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
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddScoped<ITelemetryPublisher, SignalRTelemetryPublisher>();
builder.Services.AddHostedService<TelemetryConsumerHostedService>();

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

app.UseCors();

app.UseHttpsRedirection();

// Add Prometheus metrics endpoint
app.UseMetricServer();

app.UseAuthorization();

app.MapControllers();

app.MapHub<TelemetryHub>("/hubs/telemetry");

// Program.cs
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<ApplicationDbContext>();

    // Postgres'in aya�a kalkmas� i�in 30 saniye boyunca deneme yapacak
    int retryCount = 0;
    while (retryCount < 5)
    {
        try
        {
            logger.LogInformation("Veritaban�na ba�lan�l�yor ve migration uygulan�yor... (Deneme: {Count})", retryCount + 1);

            context.Database.Migrate();
            // context.Database.EnsureCreated();

            // Seed Data
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
                logger.LogInformation("Seed verisi basariyla eklendi.");
            }

            break; // Ba�ar�l�ysa d�ng�den ��k
        }
        catch (Exception ex)
        {
            retryCount++;
            logger.LogWarning("Veritaban� hen�z haz�r de�il, bekleniyor... (Hata: {Message})", ex.Message);
            Thread.Sleep(5000); // 5 saniye bekle ve tekrar dene
        }
    }
}

app.Run();