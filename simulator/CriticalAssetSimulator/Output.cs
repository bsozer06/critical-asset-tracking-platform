using System;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using RabbitMQ.Client;

namespace CriticalAssetSimulator;

/// <summary>
/// Output abstraction for telemetry messages
/// </summary>
public interface IOutput
{
    void Send(string message);
}

/// <summary>
/// Writes telemetry messages to the console
/// </summary>
public class ConsoleOutput : IOutput
{
    public void Send(string message)
    {
        Console.WriteLine(message);
        Console.WriteLine(); // readability
    }
}

/// <summary>
/// Sends telemetry messages via UDP
/// </summary>
public class UdpOutput : IOutput, IDisposable
{
    private readonly UdpClient _udpClient;
    private readonly string _host;
    private readonly int _port;

    public UdpOutput(string host, int port)
    {
        _host = host;
        _port = port;
        _udpClient = new UdpClient();
    }

    public void Send(string message)
    {
        byte[] data = Encoding.UTF8.GetBytes(message);
        _udpClient.Send(data, data.Length, _host, _port);
    }

    public void Dispose()
    {
        _udpClient.Dispose();
    }
}


public class RabbitMqOutput : IOutput, IDisposable
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;
    private readonly string _exchange;
    private readonly string _routingKey;

    public RabbitMqOutput(string hostName, int port, string userName, string password,
        string exchange, string routingKey)
    {
        _exchange = exchange;
        _routingKey = routingKey;

        var factory = new ConnectionFactory()
        {
            HostName = hostName,
            Port = port,
            UserName = userName,
            Password = password
        };

        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();

        _channel.ExchangeDeclareAsync(exchange, ExchangeType.Direct, durable: true);
    }

    public void Send(string message)
    {
        var body = Encoding.UTF8.GetBytes(message);
        var props = new BasicProperties();
         _channel.BasicPublishAsync(
            exchange: _exchange, 
            routingKey: _routingKey, 
            body: body, 
            mandatory: true, 
            basicProperties: props).GetAwaiter();
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