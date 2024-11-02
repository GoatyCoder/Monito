using FluentResults;
using Monito.Application.DTOs.RawProducts;

namespace Monito.Application.Interfaces
{
    public interface IRawProductService
    {
        Task<Result<IEnumerable<RawProductDto>>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Result<RawProductDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Result<RawProductWithVarietyDto>> GetWithVarietyByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Result<RawProductDto>> GetByCodeAsync(string shortCode, CancellationToken cancellationToken = default);
        Task<Result<RawProductWithVarietyDto>> GetWithVarietyByCodeAsync(string shortCode, CancellationToken cancellationToken = default);
        Task<Result<Guid>> AddAsync(AddRawProductDto request, CancellationToken cancellationToken = default);
        Task<Result> UpdateAsync(UpdateRawProductDto request, CancellationToken cancellationToken = default);
        Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
