using CriticalAssetTracking.Application.Dtos.Auth;

namespace CriticalAssetTracking.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken ct = default);
    Task<AuthResponseDto> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
}
