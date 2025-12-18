namespace CriticalAssetSimulator.Outputs;

/// <summary>
/// Output abstraction for telemetry messages
/// </summary>
public interface IOutput
{
    void Send(string message);
}
