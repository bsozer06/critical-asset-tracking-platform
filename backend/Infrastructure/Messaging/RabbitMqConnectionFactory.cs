using RabbitMQ.Client;

namespace CriticalAssetTracking.Infrastructure.Messaging
{
    public class RabbitMqConnectionFactory
    {
        public static IConnection Create(
           string host,
           int port,
           string user,
           string password)
        {
            var factory = new ConnectionFactory
            {
                HostName = host,
                Port = port,
                UserName = user,
                Password = password
            };

            // Updated to use CreateConnectionAsync with a synchronous wait  
            return factory.CreateConnectionAsync().GetAwaiter().GetResult();
        }
    }
}
