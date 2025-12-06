using CriticalAssetTracking.Api.BackgroundServices;
using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Processors;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.Configure<RabbitMqSettings>(
    builder.Configuration.GetSection("RabbitMq"));

// TEMP (will replace in Step A.5)
builder.Services.AddSingleton<ITelemetryProcessor, DummyTelemetryProcessor>();
builder.Services.AddHostedService<TelemetryConsumerHostedService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
