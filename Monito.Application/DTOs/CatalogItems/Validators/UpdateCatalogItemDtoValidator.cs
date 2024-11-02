using FluentValidation;

namespace Monito.Application.DTOs.CatalogItems.Validators
{
    public class UpdateCatalogItemDtoValidator : AbstractValidator<UpdateCatalogItemDto>
    {
        public UpdateCatalogItemDtoValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Id is required.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

            RuleFor(x => x.ShortCode)
                .NotEmpty().WithMessage("ShortCode is required.")
                .MaximumLength(10).WithMessage("ShortCode cannot exceed 10 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(250).WithMessage("Description cannot exceed 250 characters.")
                .When(x => x.Description != null);

            RuleFor(x => x.Ean)
                .MaximumLength(13)
                .WithMessage("EAN cannot exceed 13 characters.");

            RuleFor(x => x.TotalWeight)
                .GreaterThan(0)
                .WithMessage("Total weight must be greater than zero.");

            RuleFor(x => x.RawProductId).NotEmpty().WithMessage("RawProductId is required.");
        }
    }
}
