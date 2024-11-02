using AutoMapper;
using Monito.Application.DTOs.RawProducts;
using Monito.Domain.Entities;

namespace Monito.Application.Mappings
{
    internal class RawProductMappingProfile : Profile
    {
        public RawProductMappingProfile()
        {
            // Mapping per AddRawProductDto a RawProduct (per l'aggiunta di un nuovo prodotto)
            CreateMap<AddRawProductDto, RawProduct>();

            // Mapping per UpdateRawProductDto a RawProduct (per l'aggiornamento di un prodotto esistente)
            CreateMap<UpdateRawProductDto, RawProduct>();

            // Mapping da RawProduct a RawProductDto (per ottenere un RawProduct senza varietà)
            CreateMap<RawProduct, RawProductDto>();

            // Mapping da RawProduct a RawProductWithVarietyDto (per ottenere un RawProduct con le varietà)
            CreateMap<RawProduct, RawProductWithVarietyDto>();
        }
    }
}
