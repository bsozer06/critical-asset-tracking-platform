using Prometheus;

namespace CriticalAssetTracking.Application.Metrics
{
    public static class TelemetryMetrics
    {
        public static readonly Counter TelemetryMessagesProcessed = global::Prometheus.Metrics
            .CreateCounter("catp_telemetry_messages_processed_total", 
                "Total number of telemetry messages processed",
                new[] { "asset_type", "status" });

        public static readonly Histogram TelemetryProcessingDuration = global::Prometheus.Metrics
            .CreateHistogram("catp_telemetry_processing_duration_seconds",
                "Duration of telemetry message processing",
                new[] { "asset_type" });

        public static readonly Counter ChecksumValidationFailures = global::Prometheus.Metrics
            .CreateCounter("catp_checksum_validation_failures_total",
                "Total number of checksum validation failures",
                new[] { "asset_id", "asset_type" });

        public static readonly Gauge ActiveSignalRConnections = global::Prometheus.Metrics
            .CreateGauge("catp_signalr_connections_active",
                "Current number of active SignalR connections");

        public static readonly Counter GeofenceProcessingFailures = global::Prometheus.Metrics
            .CreateCounter("catp_geofence_processing_failures_total",
                "Total number of geofence engine processing failures",
                new[] { "asset_type" });
    }
}