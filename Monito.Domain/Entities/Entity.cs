namespace Monito.Domain.Entities
{
    public interface IEntity<TKey>
    {
        TKey Id { get; set; }
    }

    public interface IArchiveableEntity
    {
        bool IsDeleted { get; set; }
    }

    public interface IConcurrencyAware
    {
        byte[] RowVersion { get; set; }
    }

    public abstract class BaseEntity<TKey> : IEntity<TKey>
    {
        public required TKey Id { get; set; }
    }
}
