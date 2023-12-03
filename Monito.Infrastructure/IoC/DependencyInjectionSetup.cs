using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Monito.Domain.Models.Aggregates.ProducerAggregate;
using Monito.Infrastructure.Data;
using Monito.Infrastructure.Data.Repositories;

namespace Monito.Infrastructure.IoC
{
    public static class DependencyInjectionSetup
    {
        public static IServiceCollection AddInfrastructureDependencies(this IServiceCollection services)
        {
            // DbContext
            services.AddDbContextFactory<MonitoDbContext>(opt => opt.UseSqlServer(@"Server=(localdb)\mssqllocaldb;Database=MonitoDbTest"));

            //Repository
            services.AddScoped<IProducerRepository, ProducerRepository>();

            return services;
        }
    }
}
