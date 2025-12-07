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
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();

                var processor = scope.ServiceProvider.GetRequiredService<ITelemetryProcessor>();

                var connection = RabbitMqConnectionFactory.Create(
                   _settings.HostName,
                   _settings.Port,
                   _settings.UserName,
                   _settings.Password);

                var consumerLogger = _loggerFactory.CreateLogger<TelemetryConsumer>();

                var consumer = new TelemetryConsumer(
                   connection,
                   _settings.ExchangeName,
                   _settings.TelemetryQueue,
                   _settings.TelemetryRoutingKey,
                   processor,
                   consumerLogger);

                consumer.Start(stoppingToken);
                
                await Task.Delay(100, stoppingToken);
            }
            //return Task.CompletedTask;
        }
    }
}
