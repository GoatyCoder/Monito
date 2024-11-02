namespace Monito.Application.DTOs.RawProducts
{
    public sealed record AddRawProductDto(
        string Name,
        string ShortCode,
        string? Description);
}
