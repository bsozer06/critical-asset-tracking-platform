using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace CriticalAssetTracking.Infrastructure.Messaging
{
    public class TelemetryConsumer : IDisposable
    {
        private readonly IChannel _channel;
        private readonly ITelemetryProcessor _processor;
        private readonly string _queue;

        public TelemetryConsumer(
            IConnection connection,
            string exchange,
            string queue,
            string routingKey,
            ITelemetryProcessor processor)
        {
            _processor = processor;
            _queue = queue;

            // Await the asynchronous channel creation    
            _channel = connection.CreateChannelAsync().GetAwaiter().GetResult();

            _channel.ExchangeDeclareAsync(
                exchange: exchange,
                type: ExchangeType.Direct,
                durable: true,
                autoDelete: false);

            _channel.QueueDeclareAsync(
                queue: queue,
                durable: true,
                exclusive: false,
                autoDelete: false);

            _channel.QueueBindAsync(queue, exchange, routingKey);
        }

        public void Start(CancellationToken cancellationToken)
        {
            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.ReceivedAsync += async (_, ea) =>
            {
                try
                {
                    var json = Encoding.UTF8.GetString(ea.Body.ToArray());

                    var envelope = JsonSerializer.Deserialize<TelemetryEnvelope>(
                        json,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                    if (envelope != null)
                    {
                        await _processor.ProcessAsync(envelope, cancellationToken);
                    }

                    await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                }
                catch
                {
                    // MVP: reject and requeue    
                    await _channel.BasicAckAsync(ea.DeliveryTag, false);
                    //_channel.BasicAckAsync(ea.DeliveryTag, false, requeue: true);  
                }
            };

            _channel.BasicConsumeAsync(
                queue: _queue,
                autoAck: false,
                consumer: consumer);
        }

        public void Dispose()
        {
            _channel?.CloseAsync();
            _channel?.Dispose();
        }
    }
}
