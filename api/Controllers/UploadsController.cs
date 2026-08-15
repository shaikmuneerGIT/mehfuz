using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mehfuz.Api.Controllers;

[ApiController]
[Route("api/uploads")]
[Authorize]
public class UploadsController(IConfiguration config, IWebHostEnvironment env) : ControllerBase
{
    private static readonly Dictionary<string, string> AllowedTypes = new()
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/avif"] = ".avif",
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    [HttpPost]
    [RequestSizeLimit(MaxBytes)]
    public async Task<IActionResult> Upload(IFormFile? image)
    {
        if (image is null || image.Length == 0)
            return BadRequest(new { error = "No image uploaded" });

        if (image.Length > MaxBytes)
            return BadRequest(new { error = "That image is larger than the 5MB limit." });

        if (!AllowedTypes.TryGetValue(image.ContentType, out var ext))
            return BadRequest(new { error = "Only JPEG, PNG, WebP or AVIF images are allowed" });

        var uploadDir = config["UploadDir"] is { Length: > 0 } configured
            ? configured
            : Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadDir);

        // Never trust the client filename — derive a safe one server-side.
        var filename = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("n")[..8]}{ext}";
        var fullPath = Path.Combine(uploadDir, filename);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await image.CopyToAsync(stream);
        }

        return StatusCode(201, new { url = $"/uploads/{filename}" });
    }
}
