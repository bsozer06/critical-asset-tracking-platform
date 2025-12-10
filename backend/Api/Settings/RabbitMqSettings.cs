namespace CriticalAssetTracking.Api.Settings
{
    public class RabbitMqSettings
    {
        public string HostName { get; set; } = "localhost";
        public int Port { get; set; } = 5673;
        public string UserName { get; set; } = "guest";
        public string Password { get; set; } = "guest";
        public string ExchangeName { get; set; } = "catp.exchange";
        public string TelemetryQueue { get; set; } = "catp.telemetry.queue";
        public string TelemetryRoutingKey { get; set; } = "telemetry";
        public string? VHost { get; set; } = null;
        public bool UseSsl { get; set; } = false;
    }
}
