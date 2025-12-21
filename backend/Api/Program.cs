using CriticalAssetTracking.Api.Adapters;
using CriticalAssetTracking.Api.BackgroundServices;
using CriticalAssetTracking.Api.HealthChecks;
using CriticalAssetTracking.Api.Hubs;
using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Processors;
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
builder.Services.AddScoped<ITelemetryProcessor, TelemetryProcessor>();
builder.Services.AddScoped<ITelemetryPublisher, SignalRTelemetryPublisher>();
builder.Services.AddHostedService<TelemetryConsumerHostedService>();

builder.Services.AddControllers();

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

app.Run();