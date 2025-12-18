namespace CriticalAssetSimulator.Configs;

public class OutputConfig
{
    public string Type { get; set; } = "rabbitmq";
    public string? Host { get; set; }
    public int? Port { get; set; }
    public string? User { get; set; }
    public string? Password { get; set; }
    public string? Exchange { get; set; }
    public string? RoutingKey { get; set; }
    public bool? AutoDelete { get; set; } // RabbitMQ auto-delete parameter
    public bool? Exclusive { get; set; } // RabbitMQ exclusive parameter
    public string? VHost { get; set; } // CloudAMQP vhost
    public bool? UseSsl { get; set; } // CloudAMQP SSL
}
