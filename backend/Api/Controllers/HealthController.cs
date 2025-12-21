using CriticalAssetTracking.Application.Metrics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CriticalAssetTracking.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly HealthCheckService _healthCheckService;

    public HealthController(HealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    /// <summary>
    /// Basic liveness check - is the application running?
    /// </summary>
    [HttpGet("live")]
    public IActionResult Live()
    {
        return Ok(new
        {
            Status = "Alive",
            Timestamp = DateTime.UtcNow,
            Service = "CriticalAssetTracking.Api"
        });
    }

    /// <summary>
    /// Readiness check - is the application ready to accept traffic?
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        var result = await _healthCheckService.CheckHealthAsync();

        var response = new
        {
            Status = result.Status.ToString(),
            Timestamp = DateTime.UtcNow,
            TotalDuration = result.TotalDuration.TotalMilliseconds + "ms",
            Checks = result.Entries.Select(e => new
            {
                Name = e.Key,
                Status = e.Value.Status.ToString(),
                Duration = e.Value.Duration.TotalMilliseconds + "ms",
                Description = e.Value.Description,
                Error = e.Value.Exception?.Message
            })
        };

        return result.Status == HealthStatus.Healthy
            ? Ok(response)
            : StatusCode(503, response);
    }

    /// <summary>
    /// Detailed health check with all dependencies
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Health()
    {
        var result = await _healthCheckService.CheckHealthAsync();

        var response = new
        {
            Status = result.Status.ToString(),
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            TotalDuration = result.TotalDuration.TotalMilliseconds + "ms",
            SignalRConnections = (int)TelemetryMetrics.ActiveSignalRConnections.Value,
            Checks = result.Entries.Select(e => new
            {
                Name = e.Key,
                Status = e.Value.Status.ToString(),
                Duration = e.Value.Duration.TotalMilliseconds + "ms",
                Description = e.Value.Description,
                Data = e.Value.Data,
                Error = e.Value.Exception?.Message
            })
        };

        return result.Status == HealthStatus.Healthy
            ? Ok(response)
            : StatusCode(503, response);
    }
}
