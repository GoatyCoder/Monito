using AutoMapper;
using Monito.Application.DTOs.CatalogItems;
using Monito.Domain.Entities;

namespace Monito.Application.Mappings
{
    internal class CatalogItemMappingProfile : Profile
    {
        public CatalogItemMappingProfile()
        {
            // Mapping per AddCatalogItemDto a CatalogItem (per l'aggiunta di un nuovo prodotto al catalogo)
            CreateMap<AddCatalogItemDto, CatalogItem>();

            // Mapping per UpdateCatalogItemDto a CatalogItem (per l'aggiornamento di una prodotto esistente nel catalogo)
            CreateMap<UpdateCatalogItemDto, CatalogItem>();

            // Mapping da CatalogItem a CatalogItemDto
            CreateMap<CatalogItem, CatalogItemDto>()
                .ForMember(dest => dest.RawProductName, opt => opt.MapFrom(src => src.RawProduct.Name));
        }
    }
}
