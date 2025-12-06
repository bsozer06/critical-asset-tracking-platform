using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Infrastructure.Messaging;
using Microsoft.Extensions.Options;

namespace CriticalAssetTracking.Api.BackgroundServices
{
    public class TelemetryConsumerHostedService : BackgroundService
    {
        private readonly RabbitMqSettings _settings;
        private readonly ITelemetryProcessor _processor;

        public TelemetryConsumerHostedService(
          IOptions<RabbitMqSettings> options,
          ITelemetryProcessor processor)
        {
            _settings = options.Value;
            _processor = processor;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var connection = RabbitMqConnectionFactory.Create(
                _settings.HostName,
                _settings.Port,
                _settings.UserName,
                _settings.Password);

            var consumer = new TelemetryConsumer(
               connection,
               _settings.ExchangeName,
               _settings.TelemetryQueue,
               _settings.TelemetryRoutingKey,
               _processor);

            consumer.Start(stoppingToken);
            
            return Task.CompletedTask;
        }
    }
}
