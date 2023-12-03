using Microsoft.EntityFrameworkCore;
using Monito.Domain.Models.Aggregates.ProducerAggregate;

namespace Monito.Infrastructure.Data.Repositories
{
    public class ProducerRepository : GenericRepository<Producer>, IProducerRepository
    {
        public ProducerRepository(IDbContextFactory<MonitoDbContext> _contextFactory) : base(_contextFactory)
        {
        }
    }
}
