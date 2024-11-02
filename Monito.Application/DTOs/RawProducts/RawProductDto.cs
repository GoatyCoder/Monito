namespace Monito.Application.DTOs.RawProducts
{
    public sealed record RawProductDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description);
}
