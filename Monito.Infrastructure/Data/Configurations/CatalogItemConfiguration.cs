using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Monito.Domain.Entities;

namespace Monito.Infrastructure.Data.Configurations
{
    internal class CatalogItemConfiguration : IEntityTypeConfiguration<CatalogItem>
    {
        public void Configure(EntityTypeBuilder<CatalogItem> builder)
        {
            builder.HasIndex(x => x.ShortCode).IsUnique();
            builder.Property(x => x.Name).HasMaxLength(32).IsRequired();
            builder.Property(x => x.ShortCode).HasMaxLength(10).IsRequired();
            builder.Property(x => x.Description).HasMaxLength(256);
            builder.Property(x => x.RawProductId).IsRequired();
        }
    }
}
