namespace Monito.BlazorWebApp.ViewModels
{
    internal class RawProductViewModel
    {
        public Guid Id { get; set; } = Guid.Empty;
        public string Name { get; set; } = string.Empty;
        public string ShortCode { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
