using RabbitMQ.Client;

namespace CriticalAssetTracking.Infrastructure.Messaging
{
    public class RabbitMqConnectionFactory
    {
        public static IConnection Create(
           string host,
           int port,
           string user,
           string password,
           string? vhost = null,
           bool useSsl = false)
        {
            var factory = new ConnectionFactory
            {
                HostName = host,
                Port = port,
                UserName = user,
                Password = password,
                VirtualHost = vhost ?? "/"
            };

            if (useSsl)
            {
                factory.Ssl.Enabled = true;
                factory.Ssl.ServerName = host;
                // factory.Ssl.Version = System.Security.Authentication.SslProtocols.Tls12; // Gerekirse eklenir, CloudAMQP için genellikle gerekmez
            }

            // Updated to use CreateConnectionAsync with a synchronous wait  
            return factory.CreateConnectionAsync().GetAwaiter().GetResult();
        }
    }
}
