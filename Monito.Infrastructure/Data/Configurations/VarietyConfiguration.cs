using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Monito.Domain.Entities;

namespace Monito.Infrastructure.Data.Configurations
{
    internal class VarietyConfiguration : IEntityTypeConfiguration<Variety>
    {
        public void Configure(EntityTypeBuilder<Variety> builder)
        {
            builder.HasIndex(x => new { x.ShortCode, x.RawProductId }).IsUnique();
            builder.Property(x => x.Name).HasMaxLength(32).IsRequired();
            builder.Property(x => x.ShortCode).HasMaxLength(10).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(256);
            builder.Property(x => x.RawProductId).IsRequired();
        }
    }
}
