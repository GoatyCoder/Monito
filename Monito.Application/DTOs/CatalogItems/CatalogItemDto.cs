namespace Monito.Application.DTOs.CatalogItems
{
    public sealed record CatalogItemDto(
        Guid Id,
        string Name,
        string ShortCode,
        string? Description,
        string? Ean,
        decimal TotalWeight,
        Guid RawProductId,
        string RawProductName);
}
