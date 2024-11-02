using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Monito.Infrastructure.Data;

namespace Monito.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<MonitoDbContext>(options =>
            {
                options.UseInMemoryDatabase("MonitoDb");
            }, ServiceLifetime.Scoped);

            services.AddLogging();

            return services;
        }
    }
}
