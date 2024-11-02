using AutoMapper;
using FluentResults;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Monito.Application.DTOs.RawProducts;
using Monito.Application.DTOs.Varieties;
using Monito.Application.Interfaces;
using Monito.Domain.Entities;
using Monito.Infrastructure.Data;

namespace Monito.Application.Services
{
    internal class RawProductService : IRawProductService
    {
        private readonly MonitoDbContext _dbContext;
        private readonly IMapper _mapper;
        private readonly ILogger<RawProductService> _logger;
        private readonly IValidator<AddRawProductDto> _addValidator;
        private readonly IValidator<UpdateRawProductDto> _updateValidator;

        public RawProductService(
            MonitoDbContext dbContext,
            IMapper mapper,
            ILogger<RawProductService> logger,
            IValidator<AddRawProductDto> addValidator,
            IValidator<UpdateRawProductDto> updateValidator)
        {
            _dbContext = dbContext;
            _mapper = mapper;
            _logger = logger;
            _addValidator = addValidator;
            _updateValidator = updateValidator;
        }

        public async Task<Result<IEnumerable<T>>> GetAllAsync<T>(CancellationToken cancellationToken) where T : IRawProductResponseDto
        {
            _logger.LogInformation("Retrieving all RawProducts...");

            try
            {
                var rawProductDtos = await _dbContext.RawProducts
                    .AsNoTracking()
                    .Select(x => new RawProductDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description))
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Retrieve operation succeeded: {Count} RawProducts retrieved.", rawProductDtos.Count);
                return Result.Ok(rawProductDtos.AsEnumerable());
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for RawProducts cancelled.");
                return Result.Fail<IEnumerable<RawProductDto>>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation for RawProducts failed due to an unexpected error.");
                return Result.Fail<IEnumerable<RawProductDto>>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<RawProductDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving RawProduct with ID {Id}...", id);

            try
            {
                var rawProductDto = await _dbContext.RawProducts
                    .AsNoTracking()
                    .Where(x => x.Id == id)
                    .Select(x => new RawProductDto(x.Id, x.Name, x.ShortCode, x.Description))
                    .FirstOrDefaultAsync(cancellationToken);


                if (rawProductDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: RawProduct with ID {Id} not found.", id);
                    return Result.Fail<RawProductDto>("RawProduct not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", rawProductDto.Name, rawProductDto.ShortCode, id);
                return Result.Ok(rawProductDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for RawProduct with ID {Id} cancelled.", id);
                return Result.Fail<RawProductDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed for RawProduct with ID {Id} due to an unexpected error.", id);
                return Result.Fail<RawProductDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<RawProductWithVarietyDto>> GetWithVarietyByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving details for RawProduct with ID {Id}...", id);

            try
            {
                var rawProductDto = await _dbContext.RawProducts
                    .AsNoTracking()
                    .Include(x => x.Varieties)
                    .Where(x => x.Id == id)
                    .Select(x => new RawProductWithVarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Varieties.Select(v => new VarietyDto(
                            v.Id,
                            v.Name,
                            v.ShortCode,
                            v.Description,
                            v.RawProductId,
                            v.RawProduct.Name)).ToList()))
                    .FirstOrDefaultAsync(cancellationToken);

                if (rawProductDto is null)
                {
                    _logger.LogWarning("Retrieve details operation failed: RawProduct with ID {Id} not found.", id);
                    return Result.Fail<RawProductWithVarietyDto>("RawProduct not found.");
                }

                _logger.LogInformation("Retrieve details operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", rawProductDto.Name, rawProductDto.ShortCode, id);
                return Result.Ok(rawProductDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve details operation for RawProduct with ID {Id} cancelled.", id);
                return Result.Fail<RawProductWithVarietyDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve details operation failed for RawProduct with ID {Id} due to an unexpected error.", id);
                return Result.Fail<RawProductWithVarietyDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<RawProductDto>> GetByCodeAsync(string shortCode, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving RawProduct with ShortCode '{ShortCode}'...", shortCode);

            try
            {
                var rawProductDto = await _dbContext.RawProducts
                   .AsNoTracking()
                   .Where(x => x.ShortCode == shortCode)
                   .Select(x => new RawProductDto(x.Id, x.Name, x.ShortCode, x.Description))
                   .FirstOrDefaultAsync(cancellationToken);

                if (rawProductDto is null)
                {
                    _logger.LogWarning("Retrieve operation failed: RawProduct with ShortCode '{ShortCode}' not found.", shortCode);
                    return Result.Fail<RawProductDto>("RawProduct not found.");
                }

                _logger.LogInformation("Retrieve operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", rawProductDto.Name, rawProductDto.ShortCode, rawProductDto.Id);
                return Result.Ok(rawProductDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for RawProduct with ShortCode '{ShortCode}' cancelled.", shortCode);
                return Result.Fail<RawProductDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed for RawProduct with ShortCode '{ShortCode}' due to an unexpected error.", shortCode);
                return Result.Fail<RawProductDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<RawProductWithVarietyDto>> GetWithVarietyByCodeAsync(string shortCode, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving details for RawProduct with ShortCode '{ShortCode}'...", shortCode);


            try
            {
                var rawProductDto = await _dbContext.RawProducts
                    .AsNoTracking()
                    .Include(x => x.Varieties)
                    .Where(x => x.ShortCode == shortCode)
                    .Select(x => new RawProductWithVarietyDto(
                        x.Id,
                        x.Name,
                        x.ShortCode,
                        x.Description,
                        x.Varieties.Select(v => new VarietyDto(
                            v.Id,
                            v.Name,
                            v.ShortCode,
                            v.Description,
                            v.RawProductId,
                            v.RawProduct.Name)).ToList()))
                    .FirstOrDefaultAsync(cancellationToken);

                if (rawProductDto is null)
                {
                    _logger.LogWarning("Retrieve details operation failed: RawProduct with ShortCode '{ShortCode}' not found.", shortCode);
                    return Result.Fail<RawProductWithVarietyDto>("RawProduct not found.");
                }

                _logger.LogInformation("Retrieve details operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] retrieved.", rawProductDto.Name, rawProductDto.ShortCode, rawProductDto.Id);
                return Result.Ok(rawProductDto);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Retrieve operation for RawProduct with ShortCode '{ShortCode}' cancelled.", shortCode);
                return Result.Fail<RawProductWithVarietyDto>("The operation was cancelled.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieve operation failed for RawProduct with ShortCode '{ShortCode}' due to an unexpected error.", shortCode);
                return Result.Fail<RawProductWithVarietyDto>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result<Guid>> AddAsync(AddRawProductDto request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Adding RawProduct '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _addValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Add operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail<Guid>("Validation failed: " + string.Join("; ", errors));
                }

                var shortCodeExists = await _dbContext.RawProducts
                    .AsNoTracking()
                    .AnyAsync(x => x.ShortCode == request.ShortCode, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Add operation failed: A RawProduct with ShortCode '{ShortCode}' already exists.", request.ShortCode);
                    return Result.Fail<Guid>("ShortCode is already in use.");
                }

                var rawProduct = _mapper.Map<RawProduct>(request);

                _dbContext.Add(rawProduct);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Add operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] added.", rawProduct.Name, rawProduct.ShortCode, rawProduct.Id);
                return Result.Ok(rawProduct.Id);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Add operation cancelled for RawProduct '{Name}' ({Code}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Add operation failed: Database update error for RawProduct '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Add operation failed due to an unexpected error for RawProduct '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail<Guid>(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> UpdateAsync(UpdateRawProductDto request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Updating RawProduct '{Name}' ({ShortCode})...", request.Name, request.ShortCode);

            try
            {
                var validationResult = await _updateValidator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                    _logger.LogWarning("Update operation failed due to validation errors: {Errors}", errors);
                    return Result.Fail("Validation failed: " + string.Join("; ", errors));
                }

                var rawProduct = await _dbContext.RawProducts
                    .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

                if (rawProduct is null)
                {
                    _logger.LogWarning("Update operation failed: RawProduct with ID {Id} not found.", request.Id);
                    return Result.Fail("RawProduct not found.");
                }

                var shortCodeExists = await _dbContext.RawProducts
                    .AsNoTracking()
                    .AnyAsync(x => x.Id != request.Id && x.ShortCode == request.ShortCode, cancellationToken);

                if (shortCodeExists)
                {
                    _logger.LogWarning("Update operation failed: A RawProduct with ShortCode '{ShortCode}' already exists.", request.ShortCode);
                    return Result.Fail("ShortCode is already in use.");
                }

                _mapper.Map(request, rawProduct);

                await _dbContext.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Update operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] updated.", rawProduct.Name, rawProduct.ShortCode, rawProduct.Id);
                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Update operation cancelled for RawProduct '{Name}' ({Code}).", request.Name, request.ShortCode);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Update operation failed: Database update error for RawProduct '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update operation failed due to an unexpected error for RawProduct '{Name}' ({ShortCode}).", request.Name, request.ShortCode);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }

        public async Task<Result> DeleteByIdAsync(Guid id, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Deleting RawProduct with ID {Id}...", id);

            try
            {
                var rawProduct = await _dbContext.RawProducts
                    .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

                if (rawProduct is null)
                {
                    _logger.LogWarning("Delete operation failed: RawProduct with ID {Id} not found.", id);
                    return Result.Fail("RawProduct not found.");
                }

                _dbContext.RawProducts.Remove(rawProduct);
                await _dbContext.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Delete operation succeeded: RawProduct '{Name}' ({ShortCode}) [ID: {Id}] deleted.", rawProduct.Name, rawProduct.ShortCode, rawProduct.Id);
                return Result.Ok();
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Delete operation cancelled for RawProduct with ID {Id}.", id);
                return Result.Fail("The operation was cancelled.");
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Delete operation failed: Database update error for RawProduct with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Database update error.", ex));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete operation failed due to an unexpected error for RawProduct with ID {Id}.", id);
                return Result.Fail(new ExceptionalError("Unexpected error occurred.", ex));
            }
        }
    }
}
