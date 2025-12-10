using CriticalAssetTracking.Api.Settings;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Infrastructure.Messaging;
using Microsoft.Extensions.Options;

namespace CriticalAssetTracking.Api.BackgroundServices
{
    public class TelemetryConsumerHostedService : BackgroundService
    {
        private readonly RabbitMqSettings _settings;
        //private readonly ITelemetryProcessor _processor;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILoggerFactory _loggerFactory;

        public TelemetryConsumerHostedService(
            IOptions<RabbitMqSettings> options,
            IServiceScopeFactory scopeFactory,
            ILoggerFactory loggerFactory)
        {
            _settings = options.Value;
            //_processor = processor;
            _loggerFactory = loggerFactory;
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Tek connection ve consumer
            var connection = RabbitMqConnectionFactory.Create(
                _settings.HostName,
                _settings.Port,
                _settings.UserName,
                _settings.Password,
                _settings.VHost,
                _settings.UseSsl);

            var consumerLogger = _loggerFactory.CreateLogger<TelemetryConsumer>();

            using var scope = _scopeFactory.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<ITelemetryProcessor>();

            var consumer = new TelemetryConsumer(
                connection,
                _settings.ExchangeName,
                _settings.TelemetryQueue,
                _settings.TelemetryRoutingKey,
                processor,
                consumerLogger);

            consumer.Start(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }
            //return Task.CompletedTask;
        }
    }
}
