using Microsoft.EntityFrameworkCore;
using Monito.Domain.Models.Aggregates.ProducerAggregate;

namespace Monito.Infrastructure.Data
{
    public class MonitoDbContext : DbContext
    {
        public MonitoDbContext(DbContextOptions<MonitoDbContext> options) : base(options)
        {
        }

        public DbSet<Producer> Producers { get; set; }
    }
}
