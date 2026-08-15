using System.Text.RegularExpressions;

namespace Mehfuz.Api.Services;

public static partial class Slugify
{
    public static string ToSlug(string input)
    {
        var lower = input.ToLowerInvariant().Trim();
        var slug = NonAlphaNumeric().Replace(lower, "-");
        return TrimDashes().Replace(slug, "");
    }

    public static string ToUniqueSlug(string input)
    {
        var suffix = Guid.NewGuid().ToString("n")[..5];
        return $"{ToSlug(input)}-{suffix}";
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphaNumeric();

    [GeneratedRegex("(^-|-$)")]
    private static partial Regex TrimDashes();
}
