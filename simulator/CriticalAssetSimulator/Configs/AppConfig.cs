namespace CriticalAssetSimulator.Configs;

public class AppConfig
{
    public SimulationConfig Simulation { get; set; } = new();
    public OutputConfig Output { get; set; } = new();
    public SecurityConfig Security { get; set; } = new();
}
