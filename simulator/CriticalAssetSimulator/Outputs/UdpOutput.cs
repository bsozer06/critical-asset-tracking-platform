using System.Net.Sockets;
using System.Text;

namespace CriticalAssetSimulator.Outputs;


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
