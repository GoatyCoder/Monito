namespace Monito.Domain.Models.Aggregates.ProducerAggregate
{
    public class HarvestBatch : EntityBase
    {
        public DateOnly HarvestDate { get; set; }
        public int FieldId { get; set; } // Foreign Key
#pragma warning disable CS8618 // Il campo non nullable deve contenere un valore non Null all'uscita dal costruttore. Provare a dichiararlo come nullable.
        public Field Field { get; set; } // Navigation property
#pragma warning restore CS8618 // Il campo non nullable deve contenere un valore non Null all'uscita dal costruttore. Provare a dichiararlo come nullable.
        public string BatchCode => GenerateBatchCode();

        private string GenerateBatchCode()
        {
            return $"{Field.FieldCode}-{HarvestDate.DayOfYear}";
        }
    }
}
