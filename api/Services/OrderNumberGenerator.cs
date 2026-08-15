namespace Mehfuz.Api.Services;

public static class OrderNumberGenerator
{
    public static string Generate()
    {
        var now = DateTime.UtcNow;
        var rand = Random.Shared.Next(1000, 10000);
        return $"MFZ{now:yy}{now:MM}{now:dd}{rand}";
    }
}
