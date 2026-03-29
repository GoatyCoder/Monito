import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FieldLotsService } from './field-lots.service';
import { CreateFieldLotDto, UpdateFieldLotDto, FieldLotResponseDto } from './dto';
import { ListQueryDto } from '../../common/dto/list-query.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PurgeRequestDto } from '../../common/dto/purge-request.dto';
import { Roles, RolesGuard } from '../auth/guards';

@ApiTags('field-lots')
@ApiBearerAuth()
@Controller('field-lots')
@UseGuards(RolesGuard)
export class FieldLotsController {
  constructor(private readonly fieldLotsService: FieldLotsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new field lot' })
  @ApiResponse({ status: 201, description: 'FieldLot created', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'Variety not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async create(
    @Body() dto: CreateFieldLotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.create(dto, user?.sub);
  }

  @Get()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all field lots' })
  @ApiResponse({ status: 200, description: 'List of field lots' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    return this.fieldLotsService.findAll(dto);
  }

  @Get('deleted')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted field lots' })
  @ApiResponse({ status: 200, description: 'List of soft-deleted field lots' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeleted(
    @Query() dto: ListQueryDto,
  ): Promise<PaginatedResponse<FieldLotResponseDto>> {
    return this.fieldLotsService.findDeleted(dto);
  }

  @Get('deleted/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get soft-deleted field lot by ID' })
  @ApiResponse({ status: 200, description: 'Soft-deleted field lot details', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'Soft-deleted field lot not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async findDeletedById(@Param('id') id: string): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.findDeletedById(id);
  }

  @Get('all')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get all active field lots without pagination' })
  @ApiResponse({ status: 200, description: 'All active field lots', type: [FieldLotResponseDto] })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAllActive(): Promise<FieldLotResponseDto[]> {
    return this.fieldLotsService.findAllActive();
  }

  @Get('origins/countries')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get ISO country codes list' })
  @ApiResponse({ status: 200, description: 'ISO countries' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getOriginCountries() {
    return this.fieldLotsService.getOriginCountries();
  }

  @Get('origins/it/regions')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get Italy regions codes list' })
  @ApiResponse({ status: 200, description: 'Italian regions' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getItalianRegions() {
    return this.fieldLotsService.getItalianRegions();
  }

  @Get('origins/it/provinces')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get Italy provinces codes list' })
  @ApiResponse({ status: 200, description: 'Italian provinces' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getItalianProvinces(@Query('regionCode') regionCode?: string) {
    return this.fieldLotsService.getItalianProvinces(regionCode);
  }

  @Get('origins/it/comuni')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get Italy comuni codes list' })
  @ApiResponse({ status: 200, description: 'Italian comuni' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  getItalianComuni(
    @Query('regionCode') regionCode?: string,
    @Query('provinceCode') provinceCode?: string,
    @Query('search') search?: string,
  ) {
    return this.fieldLotsService.getItalianComuni({ regionCode, provinceCode, search });
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Get field lot by ID' })
  @ApiResponse({ status: 200, description: 'FieldLot details', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @Param('id') id: string,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update field lot' })
  @ApiResponse({ status: 200, description: 'FieldLot updated', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFieldLotDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.update(id, dto, user?.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete field lot' })
  @ApiResponse({ status: 204, description: 'FieldLot soft-deleted' })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  @ApiResponse({ status: 409, description: 'FieldLot already deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ): Promise<void> {
    return this.fieldLotsService.delete(id, user?.sub);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore soft-deleted field lot' })
  @ApiResponse({ status: 200, description: 'FieldLot restored', type: FieldLotResponseDto })
  @ApiResponse({ status: 404, description: 'FieldLot not found' })
  @ApiResponse({ status: 409, description: 'FieldLot is not deleted' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<FieldLotResponseDto> {
    return this.fieldLotsService.restore(id, user?.sub);
  }

  @Post(':id/purge')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Purge soft-deleted field lot permanently' })
  @ApiResponse({ status: 204, description: 'Field lot purged' })
  @ApiResponse({ status: 404, description: 'Field lot not found' })
  @ApiResponse({ status: 409, description: 'Field lot is active or still referenced' })
  @ApiForbiddenResponse({ description: 'Forbidden - Admin only' })
  async purge(
    @Param('id') id: string,
    @Body() dto: PurgeRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.fieldLotsService.purge(id, dto.reason, user?.sub);
  }
}
