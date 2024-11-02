namespace Monito.Application.DTOs.Varieties
{
    public sealed record AddVarietyDto(
        string Name, 
        string ShortCode, 
        string? Description, 
        Guid RawProductId);
}
