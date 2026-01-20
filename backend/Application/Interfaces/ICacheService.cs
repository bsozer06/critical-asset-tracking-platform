namespace CriticalAssetTracking.Application.Interfaces
{
    // For REDIS!
    public interface ICacheService
    {
        Task<T> GetAsync<T>(string key);
        Task SetAsync<T>(string key, T value);
    }
}
