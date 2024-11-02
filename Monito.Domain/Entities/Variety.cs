namespace Monito.Domain.Entities
{
    public class Variety : BaseEntity<Guid>
    {
        public required string Name { get; set; }
        public required string ShortCode { get; set; }
        public string? Description { get; set; }
        public Guid RawProductId { get; set; }
        public virtual RawProduct RawProduct { get; set; }
    }
}


//public IEnumerable<VarietyCharacteristic> Characteristics { get; set; } = new List<VarietyCharacteristic>();

//public class VarietyCharacteristic : IEntity<Guid>
//{
//    public Guid Id { get; set; }
//    public Guid VarietyId { get; set; }
//    public Variety Variety { get; set; }
//    public Guid CharacteristicTypeId { get; set; }
//    public CharacteristicType CharacteristicType { get; set; }
//    public string Value { get; set; }
//}

//public class CharacteristicType
//{
//    public Guid Id { get; set; }
//    public string Name { get; set; }
//    public string Description { get; set; }
//}