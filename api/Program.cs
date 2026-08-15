using System.Text;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Mehfuz.Api.Data;
using Mehfuz.Api.Middleware;
using Mehfuz.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var jwtSecret = builder.Configuration["Jwt:Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    Console.Error.WriteLine(
        "FATAL: Jwt:Secret is not configured. Set it via `dotnet user-secrets set \"Jwt:Secret\" \"...\"` " +
        "locally, or the Jwt__Secret environment variable in production."
    );
    Environment.Exit(1);
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<MehfuzDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<JwtService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();

// Rate limiting on login/checkout — config in appsettings.json under IpRateLimiting.
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

var clientOrigins = (builder.Configuration["ClientOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(policy =>
    {
        if (clientOrigins.Length > 0)
            policy.WithOrigins(clientOrigins).AllowAnyHeader().AllowAnyMethod();
        else
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// IMPORTANT: every app.Use...() call must be registered before any
// app.Map...() call. In the minimal hosting model, ASP.NET Core inserts the
// routing/endpoint-execution point at the position of the first Map call —
// a Use() added afterward (as an earlier version of this file did with
// UseStaticFiles) silently ends up in the wrong place in the pipeline and
// requests stop reaching controller actions as expected. Keep all
// middleware here, all endpoints below.

// Behind IIS/a reverse proxy, forwarded headers let rate limiting and
// request.Scheme see the real client IP/protocol instead of the proxy's.
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
});

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseIpRateLimiting();

app.UseAuthentication();
app.UseAuthorization();

// Serve uploaded product photos from the configured directory (defaults to
// ./uploads next to the app, or UploadDir if set for a persistent location).
var uploadDir = app.Configuration["UploadDir"] is { Length: > 0 } configured
    ? configured
    : Path.Combine(app.Environment.ContentRootPath, "uploads");
Directory.CreateDirectory(uploadDir);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadDir),
    RequestPath = "/uploads",
});

// In production this process also serves the built React app, so the whole
// shop runs on one origin. clientDist points at client/dist relative to the
// published app; absent in API-only local dev, which is fine.
var clientDist = Path.Combine(app.Environment.ContentRootPath, "client-dist");
var hasClientDist = File.Exists(Path.Combine(clientDist, "index.html"));
if (hasClientDist)
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(clientDist),
        // Hashed asset filenames are safe to cache hard; index.html must not
        // be, or browsers keep loading the previous release after a deploy.
        OnPrepareResponse = ctx =>
        {
            if (ctx.File.Name == "index.html")
                ctx.Context.Response.Headers.CacheControl = "no-cache";
            else
                ctx.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
        },
    });
}

// ---- Endpoints (must come after every Use() above) ----

app.MapGet("/api/health", () => Results.Ok(new { ok = true, service = "mehfuz-api" }));

app.MapControllers();

if (hasClientDist)
{
    // Client-side routes (/shop, /admin/…) must return index.html so a
    // direct visit or refresh doesn't 404. Only reached when nothing above
    // matched, so /api/* 404s naturally hit the controllers' own not-found
    // handling first and never fall through to here.
    app.MapFallback(async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(Path.Combine(clientDist, "index.html"));
    });
}

// Apply pending migrations and seed the catalog/admin user on startup —
// idempotent, safe to run every time the app boots.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MehfuzDbContext>();
    db.Database.Migrate();
    await DbSeeder.SeedAsync(db, app.Configuration);
}

app.Run();
