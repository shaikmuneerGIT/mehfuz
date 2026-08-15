using Microsoft.Data.SqlClient;
using System.Text.Json;

namespace Mehfuz.Api.Middleware;

/// <summary>
/// Thrown deliberately to return a specific status/message to the client,
/// bypassing the generic 500 fallback below.
/// </summary>
public class HttpException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (status, message) = Map(ex);

            // Never leak stack traces or SQL details to the client.
            if (status >= 500)
                logger.LogError(ex, "Unhandled error on {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = status;
            await context.Response.WriteAsync(JsonSerializer.Serialize(new { error = message }));
        }
    }

    private static (int Status, string Message) Map(Exception ex) => ex switch
    {
        HttpException h => (h.Status, h.Message),

        // SQL Server foreign-key violation — usually deleting something still referenced.
        SqlException { Number: 547 } =>
            (409, "This record is still referenced by other data and cannot be deleted"),

        // Unique constraint violation.
        SqlException { Number: 2601 or 2627 } =>
            (409, "That value is already taken"),

        _ => (500, "Something went wrong. Please try again."),
    };
}
