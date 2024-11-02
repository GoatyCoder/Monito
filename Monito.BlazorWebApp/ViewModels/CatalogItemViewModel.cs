namespace Monito.BlazorWebApp.ViewModels
{
    internal class CatalogItemViewModel
    {
        public Guid Id { get; set; } = Guid.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortCode { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public string? Ean { get; set; } = string.Empty;
        public decimal TotalWeight { get; set; } = decimal.Zero;
        public Guid RawProductId { get; set; } = Guid.Empty;
        public string RawProductName { get; set; } = string.Empty;
    }
}
