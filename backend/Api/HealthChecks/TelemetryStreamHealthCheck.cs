using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace CriticalAssetTracking.Api.HealthChecks;

/// <summary>
/// Health check that monitors if telemetry messages are being received.
/// Useful to detect if the simulator is running and sending data.
/// </summary>
public class TelemetryStreamHealthCheck : IHealthCheck
{
    private static DateTime _lastMessageReceived = DateTime.MinValue;
    private static long _messageCount = 0;
    private readonly TimeSpan _unhealthyThreshold = TimeSpan.FromSeconds(30);

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var timeSinceLastMessage = DateTime.UtcNow - _lastMessageReceived;
        
        // If we've never received a message
        if (_lastMessageReceived == DateTime.MinValue)
        {
            return Task.FromResult(HealthCheckResult.Degraded(
                "No telemetry messages received yet. Simulator may not be running.",
                data: new Dictionary<string, object>
                {
                    { "messageCount", _messageCount },
                    { "status", "waiting" }
                }));
        }

        // If last message was too long ago
        if (timeSinceLastMessage > _unhealthyThreshold)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                $"No telemetry received for {timeSinceLastMessage.TotalSeconds:F0} seconds. Simulator may be stopped.",
                data: new Dictionary<string, object>
                {
                    { "lastMessageReceived", _lastMessageReceived },
                    { "secondsSinceLastMessage", timeSinceLastMessage.TotalSeconds },
                    { "messageCount", _messageCount },
                    { "status", "stale" }
                }));
        }

        // All good
        return Task.FromResult(HealthCheckResult.Healthy(
            $"Telemetry stream active. {_messageCount} messages received.",
            data: new Dictionary<string, object>
            {
                { "lastMessageReceived", _lastMessageReceived },
                { "secondsSinceLastMessage", timeSinceLastMessage.TotalSeconds },
                { "messageCount", _messageCount },
                { "status", "active" }
            }));
    }

    /// <summary>
    /// Call this method whenever a telemetry message is received.
    /// </summary>
    public static void RecordMessageReceived()
    {
        _lastMessageReceived = DateTime.UtcNow;
        Interlocked.Increment(ref _messageCount);
    }

    /// <summary>
    /// Get the current message count.
    /// </summary>
    public static long MessageCount => _messageCount;

    /// <summary>
    /// Get the last message received time.
    /// </summary>
    public static DateTime LastMessageReceived => _lastMessageReceived;
}
