namespace Monito.Domain.Models.Aggregates.ProducerAggregate
{
    public class Producer : EntityBase
    {
#pragma warning disable CS8618 // Il campo non nullable deve contenere un valore non Null all'uscita dal costruttore. Provare a dichiararlo come nullable.
        public string Name { get; set; }
#pragma warning restore CS8618 // Il campo non nullable deve contenere un valore non Null all'uscita dal costruttore. Provare a dichiararlo come nullable.
        public List<Field> Fields { get; set; } = new();
    }
}
