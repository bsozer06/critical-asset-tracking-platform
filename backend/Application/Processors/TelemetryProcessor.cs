using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Domain.Models;

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
            var header = envelope.Message.Header;
            var body = envelope.Message.Body;

            var telemetry = new TelemetryPoint(
                header.AssetId,
                body.Latitude,
                body.Longitude,
                body.AltitudeMeters,
                body.SpeedMps,
                body.HeadingDeg,
                header.TimestampUtc,
                header.Classification
            );

            await _publisher.PublishAsync(telemetry, ct);
        }
    }
}