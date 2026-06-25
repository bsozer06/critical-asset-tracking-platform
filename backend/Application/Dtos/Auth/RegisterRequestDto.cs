namespace CriticalAssetTracking.Application.Dtos.Auth;

public record RegisterRequestDto(string Email, string Password, string Role);
