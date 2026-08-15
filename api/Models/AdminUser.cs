namespace Mehfuz.Api.Models;

public class AdminUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString("n");
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
