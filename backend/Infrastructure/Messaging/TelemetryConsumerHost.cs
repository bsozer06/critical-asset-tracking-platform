using Microsoft.Extensions.Hosting;

namespace CriticalAssetTracking.Infrastructure.Messaging
{
    public class TelemetryConsumerHost : IHostedService
    {
        private readonly TelemetryConsumer _consumer;

        public TelemetryConsumerHost(TelemetryConsumer consumer)
        {
            _consumer = consumer;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            _consumer.Start(cancellationToken);
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _consumer.Dispose();
            return Task.CompletedTask;
        }
    }
}
