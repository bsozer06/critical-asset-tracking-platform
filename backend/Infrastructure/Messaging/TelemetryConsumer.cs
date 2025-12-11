using CriticalAssetTracking.Application.Contracts;
using CriticalAssetTracking.Application.Interfaces;
using CriticalAssetTracking.Application.Security;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<TelemetryConsumer> _logger;

        public TelemetryConsumer(
            IConnection connection,
            string exchange,
            string queue,
            string routingKey,
            ITelemetryProcessor processor,
            ILogger<TelemetryConsumer> logger)
        {
            _processor = processor;
            _queue = queue;
            _logger = logger;

            // Await the asynchronous channel creation    
            _logger.LogInformation("Creating channel...");
            _channel = connection.CreateChannelAsync().GetAwaiter().GetResult();
            _logger.LogInformation("Channel created.");

            _logger.LogInformation("Declaring exchange: {Exchange}", exchange);
            _channel.ExchangeDeclareAsync(
                exchange: exchange,
                type: ExchangeType.Direct,
                durable: true,
                autoDelete: false);
            _logger.LogInformation("Exchange declared: {Exchange}", exchange);

            _logger.LogInformation("Declaring queue: {Queue}", queue);
            _channel.QueueDeclareAsync(
                queue: queue,
                durable: true,
                exclusive: false,
                autoDelete: false);
            _logger.LogInformation("Queue declared: {Queue}", queue);

            _logger.LogInformation("Binding queue {Queue} to exchange {Exchange} with routing key {RoutingKey}", queue, exchange, routingKey);
            _channel.QueueBindAsync(queue, exchange, routingKey);
            _logger.LogInformation("Queue bound.");
        }

        public void Start(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting consumer for queue: {Queue}", _queue);
            var consumer = new AsyncEventingBasicConsumer(_channel);

            consumer.ReceivedAsync += async (_, ea) =>
            {
                try
                {
                    // 1) get raw incoming bytes/string
                    var rawJson = Encoding.UTF8.GetString(ea.Body.ToArray());
                    Console.WriteLine("📦 RAW JSON: " + rawJson);

                    // 2) parse and extract exact raw text of the "message" element
                    using var doc = JsonDocument.Parse(rawJson);
                    if (!doc.RootElement.TryGetProperty("message", out var messageElement))
                    {
                        _logger.LogWarning("No 'message' element found in envelope");
                        await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                        return;
                    }

                    string messageRawText = messageElement.GetRawText(); // THIS is the exact bytes the simulator hashed

                    // 3) deserialize envelope only for convenience (optional)
                    var envelope = JsonSerializer.Deserialize<TelemetryEnvelope>(
                        rawJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (envelope == null)
                    {
                        _logger.LogWarning("Invalid JSON envelope");
                        await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                        return;
                    }

                    // 4) compute checksum from raw message text and compare
                    var calculated = ChecksumCalculator.ComputeCrc32FromString(messageRawText);
                    var received = envelope.Integrity?.Checksum ?? string.Empty;

                    if (!string.Equals(calculated, received, StringComparison.OrdinalIgnoreCase))
                    {
                        _logger.LogWarning(
                            "[SECURITY] CHECKSUM MISMATCH | Asset:{AssetId} | Received:{Received} | Calc:{Calc}",
                            envelope.Message.Header.AssetId,
                            received,
                            calculated);

                        // decide: ack or nack -> forensics prefer send to dead-letter then ack.
                        await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                        return; // DROP MESSAGE
                    }

                    // 5) pass the envelope forward (now validated)
                    await _processor.ProcessAsync(envelope, cancellationToken);

                    await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while processing telemetry message");
                    // On unexpected error, nack/requeue or ack depending on policy. MVP: ack (avoid infinite loop).
                    await _channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
                }
            };

            _logger.LogInformation("Registering consumer to queue: {Queue}", _queue);
            _channel.BasicConsumeAsync(
                queue: _queue,
                autoAck: false,
                consumer: consumer).GetAwaiter().GetResult();
            _logger.LogInformation("Consumer registered successfully to queue: {Queue}", _queue);
        }

        public void Dispose()
        {
            _channel?.CloseAsync();
            _channel?.Dispose();
        }
    }
}
