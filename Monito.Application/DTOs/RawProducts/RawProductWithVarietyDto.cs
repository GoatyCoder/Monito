using Monito.Application.DTOs.Varieties;

namespace Monito.Application.DTOs.RawProducts
{
    public sealed record RawProductWithVarietyDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description,
        IEnumerable<VarietyDto> Varieties);
}
