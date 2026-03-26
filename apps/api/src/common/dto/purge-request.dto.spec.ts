import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PurgeRequestDto } from './purge-request.dto';

describe('PurgeRequestDto', () => {
  it('passes validation with a valid reason', async () => {
    const dto = plainToInstance(PurgeRequestDto, {
      reason: 'Record created by mistake',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails validation when reason is too short', async () => {
    const dto = plainToInstance(PurgeRequestDto, {
      reason: 'x',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails validation when reason is missing', async () => {
    const dto = plainToInstance(PurgeRequestDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
