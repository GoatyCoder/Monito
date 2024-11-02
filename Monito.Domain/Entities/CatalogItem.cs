namespace Monito.Domain.Entities
{
    public class CatalogItem : BaseEntity<Guid>
    {
        public required string Name { get; set; }
        public required string ShortCode { get; set; }
        public string? Description { get; set; }
        public string? Ean { get; set; }
        public decimal TotalWeight { get; set; }
        public Guid RawProductId { get; set; }
        public virtual RawProduct RawProduct { get; set; }
    }
}
