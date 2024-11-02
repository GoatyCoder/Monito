using Microsoft.EntityFrameworkCore;
using Monito.Domain.Entities;

namespace Monito.Infrastructure.Data
{
    public class MonitoDbContext : DbContext
    {
        public DbSet<RawProduct> RawProducts { get; set; }
        public DbSet<Variety> Varieties { get; set; }
        public DbSet<CatalogItem> CatalogItems { get; set; }

        public MonitoDbContext(DbContextOptions<MonitoDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(MonitoDbContext).Assembly);
        }
    }
}
