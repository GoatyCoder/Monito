namespace Monito.Application.DTOs.Varieties
{
    public sealed record VarietyDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description,
        Guid RawProductId,
        string RawProductName);
}
