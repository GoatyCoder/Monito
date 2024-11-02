namespace Monito.Domain.Entities
{
    public class RawProduct : BaseEntity<Guid>
    {
        public required string Name { get; set; }
        public required string ShortCode { get; set; }
        public string? Description { get; set; }
        public virtual IEnumerable<Variety>? Varieties { get; set; }
    }
}
