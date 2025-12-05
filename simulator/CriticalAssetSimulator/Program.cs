using System.Text.Json;

namespace CriticalAssetSimulator;

class Program
{
    static async Task Main()
    {
        // --- Load config ---
        var configJson = File.ReadAllText("config.json");
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        var config = JsonSerializer.Deserialize<AppConfig>(configJson, options)!;

        // --- Resolve values ---
        int assetCount = config.Simulation.AssetCount;
        int intervalMs = config.Simulation.UpdateIntervalMs;

        var classification =
            Enum.Parse<ClassificationLevel>(
                config.Security.Classification,
                ignoreCase: true
            );

        // --- Components ---
        var simulator = new Simulator(assetCount, config);

        IOutput output = config.Output.Type.ToLower() switch
        {
            "udp" => new UdpOutput(
                        config.Output.Host!,
                        config.Output.Port!.Value),
            _ => new ConsoleOutput()
        };

        Console.WriteLine("Simulator started using config.json\n");

        // --- Main loop ---
        while (true)
        {
            // Console.WriteLine("Loop tick...");

            var telemetry = simulator.Step(intervalMs);
            Console.WriteLine($"Telemetry count: {telemetry.Count()}");

            foreach (var t in telemetry)
            {
                var msg = TelemetryMessage.Build(t, classification);
                output.Send(msg);
            }

            await Task.Delay(intervalMs);
        }
    }
}
