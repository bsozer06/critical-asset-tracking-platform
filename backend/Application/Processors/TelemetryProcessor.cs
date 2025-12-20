using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Metrics;
using CriticalAssetTracking.Domain.Models;
using System.Diagnostics;

namespace CriticalAssetTracking.Application.Processors
{
    public class TelemetryProcessor : ITelemetryProcessor
    {
        private readonly ITelemetryPublisher _publisher;

        public TelemetryProcessor(ITelemetryPublisher publisher)
        {
            _publisher = publisher;
        }

        public async Task ProcessAsync(
        TelemetryEnvelope envelope,
        CancellationToken ct = default)
        {
            var stopwatch = Stopwatch.StartNew();
            var header = envelope.Message.Header;
            var body = envelope.Message.Body;
            var assetType = header.AssetType?.ToLower() ?? "unknown";

            try
            {
                var telemetry = new TelemetryPoint(
                header.AssetId,
                body.Latitude,
                body.Longitude,
                body.AltitudeMeters,
                body.SpeedMetersPerSecond,
                body.HeadingDegrees,
                header.TimestampUtc,
                header.Classification,
                header.AssetType ?? "unknown"
                );

                await _publisher.PublishAsync(telemetry, ct);

                // Record successful processing
                TelemetryMetrics.TelemetryMessagesProcessed
                        .Labels(assetType, "success")
                        .Inc();
            }
            catch (Exception)
            {
                // Record failed processing
                TelemetryMetrics.TelemetryMessagesProcessed
                    .Labels(assetType, "error")
                    .Inc();
                throw;
            }
            finally
            {
                stopwatch.Stop();
                TelemetryMetrics.TelemetryProcessingDuration
                    .Labels(assetType)
                    .Observe(stopwatch.Elapsed.TotalSeconds);
            }
          
        }
    }
}