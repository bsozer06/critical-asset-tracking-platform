using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Dtos;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Metrics;
using CriticalAssetTracking.Application.Services;
using CriticalAssetTracking.Domain.Models;
using System.Diagnostics;

namespace CriticalAssetTracking.Application.Processors
{
    public class TelemetryProcessor : ITelemetryProcessor
    {
        private readonly ITelemetryPublisher _publisher;
        private readonly IGeofenceEngine _geofenceEngine;

        public TelemetryProcessor(ITelemetryPublisher publisher, IGeofenceEngine geofenceEngine)
        {
            _publisher = publisher;
            _geofenceEngine = geofenceEngine;
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

                var message = new TelemetryMessageDto(
                    envelope.Message.Header.AssetId,
                    envelope.Message.Body.Latitude,
                    envelope.Message.Body.Longitude,
                    envelope.Message.Header.TimestampUtc
                );

                await _geofenceEngine.ProcessTelemetryAsync(message);
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