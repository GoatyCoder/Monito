namespace Monito.Application.DTOs.RawProducts
{
    public sealed record UpdateRawProductDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description);
}
