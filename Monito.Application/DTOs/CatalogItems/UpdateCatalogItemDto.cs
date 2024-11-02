namespace Monito.Application.DTOs.CatalogItems
{
    public sealed record UpdateCatalogItemDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description,
        string? Ean,
        decimal TotalWeight,
        Guid RawProductId);
}
