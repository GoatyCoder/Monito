using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Monito.Application.Interfaces;
using Monito.Application.Mappings;
using Monito.Application.Services;

namespace Monito.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // AutoMapper
            services.AddAutoMapper(cfg =>
            {
                cfg.AddProfile<RawProductMappingProfile>();
                cfg.AddProfile<VarietyMappingProfile>();
                cfg.AddProfile<CatalogItemMappingProfile>();
            }, typeof(DependencyInjection).Assembly);

            // Fluent Validation
            services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

            // Service
            services.AddScoped<IRawProductService, RawProductService>();
            services.AddScoped<IVarietyService, VarietyService>();
            services.AddScoped<ICatalogItemService, CatalogItemService>();

            return services;
        }
    }
}
