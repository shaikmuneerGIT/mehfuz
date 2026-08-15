using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mehfuz.Api.Data;
using Mehfuz.Api.DTOs;
using Mehfuz.Api.Services;

namespace Mehfuz.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(MehfuzDbContext db, JwtService jwt) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var admin = await db.AdminUsers.FirstOrDefaultAsync(a => a.Email == request.Email);
        if (admin is null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials" });

        var token = jwt.GenerateToken(admin);
        return Ok(new LoginResponse(token, new AdminInfoDto(admin.Id, admin.Email, admin.Name)));
    }
}
