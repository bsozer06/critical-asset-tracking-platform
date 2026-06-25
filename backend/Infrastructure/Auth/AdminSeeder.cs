using CriticalAssetTracking.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace CriticalAssetTracking.Infrastructure.Auth;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("AdminSeeder");

        foreach (var role in new[] { "Admin", "Operator" })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role: {Role}", role);
            }
        }

        var adminEmail = configuration["Auth:DefaultAdminEmail"] ?? "admin@catp.local";
        var adminPassword = configuration["Auth:DefaultAdminPassword"]
            ?? throw new InvalidOperationException("Auth:DefaultAdminPassword is not configured.");

        if (await userManager.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(admin, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
                logger.LogInformation("Default admin user seeded: {Email}", adminEmail);
            }
            else
            {
                logger.LogError("Failed to seed admin user: {Errors}",
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        var operatorEmail = configuration["Auth:DefaultOperatorEmail"] ?? "operator@catp.local";
        var operatorPassword = configuration["Auth:DefaultOperatorPassword"]
            ?? throw new InvalidOperationException("Auth:DefaultOperatorPassword is not configured.");

        if (await userManager.FindByEmailAsync(operatorEmail) is null)
        {
            var operatorUser = new ApplicationUser
            {
                UserName = operatorEmail,
                Email = operatorEmail,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(operatorUser, operatorPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(operatorUser, "Operator");
                logger.LogInformation("Default operator user seeded: {Email}", operatorEmail);
            }
            else
            {
                logger.LogError("Failed to seed operator user: {Errors}",
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
}
