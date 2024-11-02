using FluentResults;
using Monito.Application.DTOs.CatalogItems;

namespace Monito.Application.Interfaces
{
    public interface ICatalogItemService
    {
        Task<Result<IEnumerable<CatalogItemDto>>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Result<IEnumerable<CatalogItemDto>>> GetByRawProductIdAsync(Guid rawProductId, CancellationToken cancellationToken = default);
        Task<Result<CatalogItemDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Result<CatalogItemDto>> GetByCodeAsync(string shortCode, CancellationToken cancellationToken = default);
        Task<Result<Guid>> AddAsync(AddCatalogItemDto request, CancellationToken cancellationToken = default);
        Task<Result> UpdateAsync(UpdateCatalogItemDto request, CancellationToken cancellationToken = default);
        Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
