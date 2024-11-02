using AutoMapper;
using Monito.Application.DTOs.CatalogItems;
using Monito.Application.DTOs.RawProducts;
using Monito.Application.DTOs.Varieties;
using Monito.BlazorWebApp.ViewModels;

namespace Monito.BlazorWebApp.Mappings
{
    internal class UIMappingProfile : Profile
    {
        public UIMappingProfile()
        {
            CreateMap<RawProductViewModel, AddRawProductDto>();
            CreateMap<RawProductViewModel, UpdateRawProductDto>();
            CreateMap<RawProductViewModel, RawProductDto>().ReverseMap();

            CreateMap<VarietyViewModel, AddVarietyDto>();
            CreateMap<VarietyViewModel, UpdateVarietyDto>();
            CreateMap<VarietyViewModel, VarietyDto>().ReverseMap();

            CreateMap<CatalogItemViewModel, AddCatalogItemDto>();
            CreateMap<CatalogItemViewModel, UpdateCatalogItemDto>();
            CreateMap<CatalogItemViewModel, CatalogItemDto>().ReverseMap();
        }
    }
}
