using System.IO.Hashing;
using System.Text;
using System.Text.Json;

namespace CriticalAssetTracking.Application.Security
{
    public static class ChecksumCalculator
    {
        public static string ComputeCrc32(object message)
        {
            var json = JsonSerializer.Serialize(message);
            var bytes = Encoding.UTF8.GetBytes(json);

            var crc = new Crc32();
            crc.Append(bytes);

            return BitConverter.ToString(crc.GetCurrentHash()).Replace("-", "");
        }

        public static string ComputeCrc32FromString(string json)
        {
            var bytes = Encoding.UTF8.GetBytes(json);
            var crc = new Crc32();
            crc.Append(bytes);
            return BitConverter.ToString(crc.GetCurrentHash()).Replace("-", "");
        }
    }
}
