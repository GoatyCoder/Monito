using AutoMapper;
using Monito.Application.DTOs.Varieties;
using Monito.Domain.Entities;

namespace Monito.Application.Mappings
{
    internal class VarietyMappingProfile : Profile
    {
        public VarietyMappingProfile()
        {
            // Mapping per AddVarietyDto a Variety (per l'aggiunta di una nuova varietà)
            CreateMap<AddVarietyDto, Variety>();

            // Mapping per UpdateVarietyDto a Variety (per l'aggiornamento di una varietà esistente)
            CreateMap<UpdateVarietyDto, Variety>();

            // Mapping da Variety a VarietyDto (per ottenere una varietà con i dettagli del prodotto)
            CreateMap<Variety, VarietyDto>()
                .ForMember(dest => dest.RawProductName, opt => opt.MapFrom(src => src.RawProduct.Name));
        }
    }
}
