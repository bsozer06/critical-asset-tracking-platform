namespace CriticalAssetTracking.Application.Security
{
    public static class IntegrityValidator
    {
        public static bool Validate(
            object message,
            string receivedChecksum,
            out string calculatedChecksum)
        {
            calculatedChecksum = ChecksumCalculator.ComputeCrc32(message);
            return calculatedChecksum == receivedChecksum;
        }

        public static bool ValidateFromString(
           string message,
           string receivedChecksum,
           out string calculatedChecksum)
        {
            calculatedChecksum = ChecksumCalculator.ComputeCrc32FromString(message);
            return calculatedChecksum == receivedChecksum;
        }
    }
}
