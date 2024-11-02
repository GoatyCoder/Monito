using AutoMapper;
using FluentResults;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Monito.Application.DTOs.Varieties;
using Monito.Application.Interfaces;
using Monito.Domain.Entities;
using Monito.Infrastructure.Data;

namespace Monito.Application.Services
{
    internal class VarietyService : IVarietyService
    {
        private readonly MonitoDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<VarietyService> _logger;
        private readonly IValidator<AddVarietyDto> _addValidator;
        private readonly IValidator<UpdateVarietyDto> _updateValidator;

        public VarietyService(
            MonitoDbContext dbContext,
            IMapper mapper,
            ILogger<VarietyService> logger,
            IValidator<AddVarietyDto> addValidator,
            IValidator<UpdateVarietyDto> updateValidator)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _logger = logger;
            _addValidator = addValidator;
            _updateValidator = updateValidator;
        }

        public async Task<Result<IEnumerable<VarietyDto>>> GetAllAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving all Varieties...");

            try
            {
                var varietyDtos = await _dbContext.Varieties
                    .AsNoTracking()
                    .Include(x => x.RawProduct)
                    .Select(x => new VarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Retrieve operation succeeded: {Count} Varieties retrieved.", varietyDtos.Count);
                return Result.Ok(varietyDtos.AsEnumerable());
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for Varieties cancelled.");
                return Result.Fail<IEnumerable<VarietyDto>>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation for Varieties failed due to an unexpected error.");
                return Result.Fail<IEnumerable<VarietyDto>>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<IEnumerable<VarietyDto>>> GetByRawProductIdAsync(Guid rawProductId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving all Varieties for RawProduct with ID {RawProductId}...", rawProductId);

            try
            {
                var varietyDtos = await _dbContext.Varieties
                    .AsNoTracking()
                    .Include(x => x.RawProduct)
                    .Where(x => x.RawProductId == rawProductId)
                    .Select(x => new VarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .ToListAsync(cancellationToken);

                if (varietyDtos.Count == 0)
                {
                    _logger.LogWarning("Retrieve operation completed: No Varieties found for RawProduct with ID {RawProductId}.", rawProductId);
                    return Result.Ok(Enumerable.Empty<VarietyDto>());
                }

                _logger.LogInformation("Retrieve operation succeeded: Found {Count} Varieties for RawProduct with ID {RawProductId}.", varietyDtos.Count, rawProductId);
                return Result.Ok(varietyDtos.AsEnumerable());
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for Varieties with RawProduct ID {RawProductId} cancelled.", rawProductId);
                return Result.Fail<IEnumerable<VarietyDto>>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed due to an unexpected error for Varieties with RawProduct ID {RawProductId}.", rawProductId);
                return Result.Fail<IEnumerable<VarietyDto>>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<VarietyDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving Variety with ID {Id}...", id);

            try
            {
                var varietyDto = await _dbContext.Varieties
                    .AsNoTracking()
                    .Include(x => x.RawProduct)
                    .Where(x => x.Id == id)
                    .Select(x => new VarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .FirstOrDefaultAsync(cancellationToken);

                if (varietyDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: Variety with ID {Id} not found.", id);
                    return Result.Fail<VarietyDto>("Variety not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: Variety '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", varietyDto.Name, varietyDto.ShortCode, id);
                return Result.Ok(varietyDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for Variety with ID {Id} cancelled.", id);
                return Result.Fail<VarietyDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed for Variety with ID {Id} due to an unexpected error.", id);
                return Result.Fail<VarietyDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<VarietyDto>> GetByCodeAsync(string shortCode, Guid rawProductId, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving Variety with ShortCode '{ShortCode}' for RawProduct with ID {RawProductId}...", shortCode, rawProductId);

            try
            {
                var varietyDto = await _dbContext.Varieties
                    .AsNoTracking()
                    .Include(x => x.RawProduct)
                    .Where(x => x.ShortCode == shortCode && x.RawProductId == rawProductId)
                    .Select(x => new VarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .FirstOrDefaultAsync(cancellationToken);

                if (varietyDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: Variety with ShortCode '{ShortCode}' for RawProduct with ID {RawProductId} not found.", shortCode, rawProductId);
                    return Result.Fail<VarietyDto>("Variety not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: Variety '{Name}' ({ShortCode}) [ID: {Id}] retrieved for RawProduct with ID {RawProductId}.", varietyDto.Name, shortCode, varietyDto.Id, rawProductId);
                return Result.Ok(varietyDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for Variety with ShortCode '{ShortCode}' and RawProduct ID {RawProductId} cancelled.", shortCode, rawProductId);
                return Result.Fail<VarietyDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed due to an unexpected error for Variety with ShortCode '{ShortCode}' and RawProduct ID {RawProductId}.", shortCode, rawProductId);
                return Result.Fail<VarietyDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<Guid>> AddAsync(AddVarietyDto request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Adding Variety '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _addValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Add operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail<Guid>("Validation failed: " + string.Join("; ", errors));
                }

                var shortCodeExists = await _dbContext.Varieties
                    .AsNoTracking()
                    .AnyAsync(v => v.ShortCode == request.ShortCode && v.RawProductId == request.RawProductId, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Add operation failed: A Variety with ShortCode '{ShortCode}' already exists for the given RawProduct.", request.ShortCode);
                    return Result.Fail<Guid>("ShortCode is already in use for this RawProduct.");
                }

                var variety = _mapper.Map<Variety>(request);

                _dbContext.Varieties.Add(variety);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Add operation succeeded: Variety '{Name}' ({ShortCode}) [ID: {Id}] added.", variety.Name, variety.ShortCode, variety.Id);
                return Result.Ok(variety.Id);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Add operation cancelled for Variety '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Add operation failed: Database update error for Variety '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Add operation failed due to an unexpected error for Variety '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> UpdateAsync(UpdateVarietyDto request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Updating Variety '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Update operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail("Validation failed: " + string.Join("; ", errors));
                }

                var variety = await _dbContext.Varieties
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                if (variety is null)
                {
                    _logger.LogWarning("Update operation failed: Variety with Id {Id} not found.", request.Id);
                    return Result.Fail($"Variety not found.");
                }

                var shortCodeExists = await _dbContext.Varieties
                    .AsNoTracking()
                    .AnyAsync(x => x.ShortCode == request.ShortCode && x.RawProductId == request.RawProductId && x.Id != request.Id, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Update operation failed: A Variety with ShortCode '{ShortCode}' already exists for RawProductId '{RawProductId}'.", request.ShortCode, request.RawProductId);
                    return Result.Fail("ShortCode is already in use.");
                }

                _mapper.Map(request, variety);

                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Update operation succeeded: Variety '{Name}' ({ShortCode}) [ID: {Id}] updated.", variety.Name, variety.ShortCode, variety.Id);

                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Update operation cancelled for Variety '{Name}' ({Code}).", request.Name, request.ShortCode);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Update operation failed: Database update error for Variety '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update operation failed due to an unexpected error for Variety '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Deleting Variety with ID {Id}...", id);

            try
            {
                var variety = await _dbContext.Varieties
                    .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (variety is null)
                {
                    _logger.LogWarning("Delete operation failed: Variety with Id {Id} not found.", id);
                    return Result.Fail("Variety not found.");
                }

                _dbContext.Varieties.Remove(variety);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Delete operation succeeded: Variety '{Name}' ({ShortCode}) [ID: {Id}] deleted.", variety.Name, variety.ShortCode, variety.Id);
                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Delete operation cancelled for Variety with ID {Id}.", id);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Delete operation failed: Database update error for Variety with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete operation failed due to an unexpected error for Variety with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }
    }
}
