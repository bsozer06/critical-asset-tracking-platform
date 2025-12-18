using System.Text;
using RabbitMQ.Client;

namespace CriticalAssetSimulator.Outputs;



public class RabbitMqOutput : IOutput, IDisposable
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private readonly string _exchange;
    private readonly string _routingKey;
    private readonly bool _autoDelete;
    private readonly bool _exclusive;

    public RabbitMqOutput(string hostName, int port, string userName, string password,
        string exchange, string routingKey, bool autoDelete = false, bool exclusive = false, string? vhost = null, bool useSsl = false)
    {
        _exchange = exchange;
        _routingKey = "catp.telemetry.queue";
        _autoDelete = autoDelete;
        _exclusive = exclusive;

        var factory = new ConnectionFactory()
        {
            HostName = hostName,
            Port = port,
            UserName = userName,
            Password = password,
            VirtualHost = vhost ?? "/"
        };

        if (useSsl)
        {
            factory.Ssl.Enabled = true;
            factory.Ssl.ServerName = hostName;
        }
        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();

        _channel.ExchangeDeclareAsync(exchange, ExchangeType.Direct, durable: true, autoDelete: false);
        _channel.QueueDeclareAsync(routingKey, durable: true, exclusive: _exclusive, autoDelete: false);
        _channel.QueueBindAsync(routingKey, exchange, routingKey);
    }

    public void Send(string message)
    {
        var body = Encoding.UTF8.GetBytes(message);
        var props = new BasicProperties();
        try
        {
            Console.WriteLine($"[RabbitMQ] Publishing to exchange '{_exchange}' with routingKey 'catp.telemetry.queue'...");
            
            _channel.BasicPublishAsync(
                exchange: _exchange,
                routingKey: "catp.telemetry.queue",
                body: body,
                mandatory: true,
                basicProperties: props).GetAwaiter().GetResult();

            Console.WriteLine("[RabbitMQ] Publish SUCCESS");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RabbitMQ] Publish ERROR: {ex.Message}");
        }
        
        Console.WriteLine(Encoding.UTF8.GetString(body));
    }

    public void Dispose()
    {
        _channel?.CloseAsync();
        _channel?.Dispose();
        _connection?.CloseAsync();
        _connection?.Dispose();
    }
}