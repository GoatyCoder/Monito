import { ROLES_KEY } from './auth/guards/roles.guard';
import { ProductsController } from './products/products.controller';
import { VarietiesController } from './varieties/varieties.controller';
import { ProductVarietiesController } from './varieties/product-varieties.controller';
import { PackagingsController } from './packagings/packagings.controller';
import { ProcessedProductsController } from './processed-products/processed-products.controller';
import { FieldLotsController } from './field-lots/field-lots.controller';
import { PalletsController } from './pallets/pallets.controller';

function expectRoles(
  controller: Record<string, unknown>,
  methodName: string,
  expected: string[],
): void {
  const method = controller[methodName] as (...args: unknown[]) => unknown;
  const roles = Reflect.getMetadata(ROLES_KEY, method) as string[];
  expect(roles).toEqual(expected);
}

describe('RBAC policy metadata', () => {
  it('enforces products roles matrix', () => {
    const proto = ProductsController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });

  it('enforces varieties roles matrix', () => {
    const proto = VarietiesController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });

  it('enforces nested product varieties roles matrix', () => {
    const proto = ProductVarietiesController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'findByProductId', ['ADMIN', 'OPERATOR']);
  });

  it('enforces packagings roles matrix', () => {
    const proto = PackagingsController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });

  it('enforces processed-products roles matrix', () => {
    const proto = ProcessedProductsController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });

  it('enforces field-lots roles matrix', () => {
    const proto = FieldLotsController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });

  it('enforces pallets roles matrix', () => {
    const proto = PalletsController.prototype as unknown as Record<string, unknown>;
    expectRoles(proto, 'create', ['ADMIN']);
    expectRoles(proto, 'findAll', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findDeleted', ['ADMIN']);
    expectRoles(proto, 'findDeletedById', ['ADMIN']);
    expectRoles(proto, 'findByPalletNumber', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'findById', ['ADMIN', 'OPERATOR']);
    expectRoles(proto, 'update', ['ADMIN']);
    expectRoles(proto, 'delete', ['ADMIN']);
    expectRoles(proto, 'restore', ['ADMIN']);
    expectRoles(proto, 'purge', ['ADMIN']);
  });
});
