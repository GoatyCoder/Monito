using FluentResults;
using Monito.Application.DTOs.Varieties;

namespace Monito.Application.Interfaces
{
    public interface IVarietyService
    {
        Task<Result<IEnumerable<VarietyDto>>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<Result<IEnumerable<VarietyDto>>> GetByRawProductIdAsync(Guid rawProductId, CancellationToken cancellationToken = default);
        Task<Result<VarietyDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
        Task<Result<VarietyDto>> GetByCodeAsync(string shortCode, Guid rawProductId, CancellationToken cancellationToken = default);
        Task<Result<Guid>> AddAsync(AddVarietyDto request, CancellationToken cancellationToken = default);
        Task<Result> UpdateAsync(UpdateVarietyDto request, CancellationToken cancellationToken = default);
        Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
