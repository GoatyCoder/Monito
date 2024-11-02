namespace Monito.Application.DTOs.CatalogItems
{
    public sealed record AddCatalogItemDto(
        string Name,
        string ShortCode,
        string? Description,
        string? Ean,
        decimal TotalWeight,
        Guid RawProductId);
}
