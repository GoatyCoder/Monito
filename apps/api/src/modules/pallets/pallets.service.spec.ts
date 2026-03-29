import { PalletsService } from './pallets.service';

describe('PalletsService constraint matching', () => {
  const service = new PalletsService({} as never, { push: jest.fn() } as never);

  const canUseProcessedProduct = (
    processedProduct: {
      allowedProducts?: { productId: string }[];
      allowedSubtypes?: { productSubtypeId: string }[];
      allowedVarieties?: { varietyId: string }[];
    },
    productId: string,
    productSubtypeId: string | null,
    varietyId: string,
  ) =>
    (service as unknown as {
      isProcessedProductAllowedForFieldLot: (
        processedProductArg: {
          allowedProducts?: { productId: string }[];
          allowedSubtypes?: { productSubtypeId: string }[];
          allowedVarieties?: { varietyId: string }[];
        },
        productIdArg: string,
        productSubtypeIdArg: string | null,
        varietyIdArg: string,
      ) => boolean;
    }).isProcessedProductAllowedForFieldLot(processedProduct, productId, productSubtypeId, varietyId);

  it('allows when processed product has no constraints', () => {
    expect(canUseProcessedProduct({}, 'product-1', 'subtype-1', 'variety-1')).toBe(true);
  });

  it('allows when product constraint matches', () => {
    expect(
      canUseProcessedProduct(
        {
          allowedProducts: [{ productId: 'product-1' }],
        },
        'product-1',
        'subtype-1',
        'variety-1',
      ),
    ).toBe(true);
  });

  it('allows when subtype constraint matches', () => {
    expect(
      canUseProcessedProduct(
        {
          allowedSubtypes: [{ productSubtypeId: 'subtype-1' }],
        },
        'product-1',
        'subtype-1',
        'variety-1',
      ),
    ).toBe(true);
  });

  it('allows when variety constraint matches', () => {
    expect(
      canUseProcessedProduct(
        {
          allowedVarieties: [{ varietyId: 'variety-1' }],
        },
        'product-1',
        'subtype-1',
        'variety-1',
      ),
    ).toBe(true);
  });

  it('rejects when no OR constraint matches', () => {
    expect(
      canUseProcessedProduct(
        {
          allowedProducts: [{ productId: 'product-X' }],
          allowedSubtypes: [{ productSubtypeId: 'subtype-X' }],
          allowedVarieties: [{ varietyId: 'variety-X' }],
        },
        'product-1',
        'subtype-1',
        'variety-1',
      ),
    ).toBe(false);
  });
});
