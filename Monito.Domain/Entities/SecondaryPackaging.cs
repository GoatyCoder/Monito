namespace Monito.Domain.Entities
{
    public class SecondaryPackaging : BaseEntity<Guid>
    {
        public required string Name { get; set; }
        string? Description { get; set; }
    }
}
