namespace CriticalAssetSimulator.Outputs;

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
