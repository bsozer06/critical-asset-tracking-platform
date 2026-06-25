namespace CriticalAssetTracking.Application.Dtos.Auth;

public record AuthResponseDto(string AccessToken, string Email, string Role);
