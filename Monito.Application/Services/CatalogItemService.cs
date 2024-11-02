using AutoMapper;
using FluentResults;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Monito.Application.DTOs.CatalogItems;
using Monito.Application.Interfaces;
using Monito.Domain.Entities;
using Monito.Infrastructure.Data;

namespace Monito.Application.Services
{
    internal class CatalogItemService : ICatalogItemService
    {
        private readonly MonitoDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<CatalogItemService> _logger;
        private readonly IValidator<AddCatalogItemDto> _addValidator;
        private readonly IValidator<UpdateCatalogItemDto> _updateValidator;

        public CatalogItemService(
            MonitoDbContext dbContext,
            IMapper mapper,
            ILogger<CatalogItemService> logger,
            IValidator<AddCatalogItemDto> addValidator,
            IValidator<UpdateCatalogItemDto> updateValidator)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _logger = logger;
            _addValidator = addValidator;
            _updateValidator = updateValidator;
        }

        public async Task<Result<IEnumerable<CatalogItemDto>>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Retrieving all CatalogItems...");

            try
            {
                var catalogItemDtos = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .Include(x => x.RawProduct)
                    .Select(x => new CatalogItemDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Ean,
                        x.TotalWeight,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Retrieve operation succeeded: {Count} CatalogItems retrieved.", catalogItemDtos.Count);
                return Result.Ok(catalogItemDtos.AsEnumerable());
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for CatalogItems cancelled.");
                return Result.Fail<IEnumerable<CatalogItemDto>>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation for CatalogItems failed due to an unexpected error.");
                return Result.Fail<IEnumerable<CatalogItemDto>>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<IEnumerable<CatalogItemDto>>> GetByRawProductIdAsync(Guid rawProductId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Retrieving all CatalogItems for RawProduct with ID {RawProductId}...", rawProductId);

            try
            {
                var catalogItemDtos = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .Where(x => x.RawProductId == rawProductId)
                    .Include(x => x.RawProduct)
                    .Select(x => new CatalogItemDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Ean,
                        x.TotalWeight,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .ToListAsync(cancellationToken);

                if (catalogItemDtos.Count == 0)
                {
                    _logger.LogWarning("Retrieve operation completed: No CatalogItems found for RawProduct with ID {RawProductId}.", rawProductId);
                    return Result.Ok(Enumerable.Empty<CatalogItemDto>());
                }

                _logger.LogInformation("Retrieve operation succeeded: Found {Count} CatalogItems for RawProduct with ID {RawProductId}.", catalogItemDtos.Count, rawProductId);
                return Result.Ok(catalogItemDtos.AsEnumerable());
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for CatalogItems with RawProduct ID {RawProductId} cancelled.", rawProductId);
                return Result.Fail<IEnumerable<CatalogItemDto>>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation for CatalogItems with RawProduct ID {RawProductId} failed due to an unexpected error.", rawProductId);
                return Result.Fail<IEnumerable<CatalogItemDto>>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<CatalogItemDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Retrieving Variety with ID {Id}...", id);

            try
            {
                var catalogItemDto = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .Where(x => x.Id == id)
                    .Include(x => x.RawProduct)
                    .Select(x => new CatalogItemDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Ean,
                        x.TotalWeight,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .FirstOrDefaultAsync(cancellationToken);

                if (catalogItemDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: CatalogItem with ID {Id} not found.", id);
                    return Result.Fail<CatalogItemDto>("CatalogItem not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: CatalogItem '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", catalogItemDto.Name, catalogItemDto.ShortCode, id);
                return Result.Ok(catalogItemDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for CatalogItem with ID {Id} cancelled.", id);
                return Result.Fail<CatalogItemDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed for CatalogItem with ID {Id} due to an unexpected error.", id);
                return Result.Fail<CatalogItemDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<CatalogItemDto>> GetByCodeAsync(string shortCode, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Retrieving CatalogItem with ShortCode '{ShortCode}'...", shortCode);

            try
            {
                var catalogItemDto = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .Where(x => x.ShortCode == shortCode)
                    .Include(x => x.RawProduct)
                    .Select(x => new CatalogItemDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Ean,
                        x.TotalWeight,
                        x.RawProductId,
                        x.RawProduct.Name))
                    .FirstOrDefaultAsync(cancellationToken);

                if (catalogItemDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: CatalogItem with ShortCode '{ShortCode}' not found.", shortCode);
                    return Result.Fail<CatalogItemDto>("CatalogItem not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: CatalogItem '{Name}' ({ShortCode}) [ID: {Id}] retrieved .", catalogItemDto.Name, shortCode, catalogItemDto.Id);
                return Result.Ok(catalogItemDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for CatalogItem with ShortCode '{ShortCode}' cancelled.", shortCode);
                return Result.Fail<CatalogItemDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed due to an unexpected error for CatalogItem with ShortCode '{ShortCode}'.", shortCode);
                return Result.Fail<CatalogItemDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<Guid>> AddAsync(AddCatalogItemDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Adding CatalogItem '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _addValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Add operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail<Guid>("Validation failed: " + string.Join("; ", errors));
                }

                var shortCodeExists = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .AnyAsync(x => x.ShortCode == request.ShortCode, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Add operation failed: A CatalogItem with ShortCode '{ShortCode}' already exists.", request.ShortCode);
                    return Result.Fail<Guid>("ShortCode is already in use.");
                }

                var catalogItem = _mapper.Map<CatalogItem>(request);

                _dbContext.CatalogItems.Add(catalogItem);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Add operation succeeded: CatalogItem '{Name}' ({ShortCode}) [ID: {Id}] added.", catalogItem.Name, catalogItem.ShortCode, catalogItem.Id);
                return Result.Ok(catalogItem.Id);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Add operation cancelled for CatalogItem '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Add operation failed: Database update error for CatalogItem '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Add operation failed due to an unexpected error for CatalogItem '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> UpdateAsync(UpdateCatalogItemDto request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Updating CatalogItem '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Update operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail("Validation failed: " + string.Join("; ", errors));
                }

                var catalogItem = await _dbContext.CatalogItems
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                if (catalogItem is null)
                {
                    _logger.LogWarning("Update operation failed: CatalogItem with Id {Id} not found.", request.Id);
                    return Result.Fail($"CatalogItem not found.");
                }

                var shortCodeExists = await _dbContext.CatalogItems
                    .AsNoTracking()
                    .AnyAsync(x => x.Id != request.Id && x.ShortCode == request.ShortCode, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Update operation failed: A CatalogItem with ShortCode '{ShortCode}' already exists.", request.ShortCode);
                    return Result.Fail("ShortCode is already in use.");
                }

                _mapper.Map(request, catalogItem);

                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Update operation succeeded: CatalogItem '{Name}' ({ShortCode}) [ID: {Id}] updated.", catalogItem.Name, catalogItem.ShortCode, catalogItem.Id);

                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Update operation cancelled for CatalogItem '{Name}' ({Code}).", request.Name, request.ShortCode);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Update operation failed: Database update error for CatalogItem '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update operation failed due to an unexpected error for CatalogItem '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Deleting CatalogItem with ID {Id}...", id);

            try
            {
                var catalogItem = await _dbContext.CatalogItems
                    .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (catalogItem is null)
                {
                    _logger.LogWarning("Delete operation failed: CatalogItem with Id {Id} not found.", id);
                    return Result.Fail("CatalogItem not found.");
                }

                _dbContext.CatalogItems.Remove(catalogItem);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Delete operation succeeded: CatalogItem '{Name}' ({ShortCode}) [ID: {Id}] deleted.", catalogItem.Name, catalogItem.ShortCode, catalogItem.Id);
                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Delete operation cancelled for CatalogItem with ID {Id}.", id);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Delete operation failed: Database update error for CatalogItem with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete operation failed due to an unexpected error for CatalogItem with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }
    }
}
