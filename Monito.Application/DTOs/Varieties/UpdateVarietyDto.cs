namespace Monito.Application.DTOs.Varieties
{
    public sealed record UpdateVarietyDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description,
        Guid RawProductId);
}
