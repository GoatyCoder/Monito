import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  CreateUserResponseDto,
  ResetUserPasswordResponseDto,
  UpdateMeDto,
  UpdateUserStatusDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserPreferencesResponseDto,
  UserResponseDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { RolesGuard, Roles } from '../auth/guards';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'User created', type: CreateUserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAll(@Query() dto: PaginationDto): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user details', type: UserResponseDto })
  async getMe(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Current user updated', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'Current user preferences', type: UserPreferencesResponseDto })
  async getMePreferences(@CurrentUser() user: JwtPayload): Promise<UserPreferencesResponseDto> {
    return this.usersService.getMePreferences(user.sub);
  }

  @Patch('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({ status: 200, description: 'Current user preferences updated', type: UserPreferencesResponseDto })
  async updateMePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.usersService.updateMePreferences(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details', type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden - can only view own profile unless admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    if (user.role !== 'ADMIN' && user.sub !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto, user.sub);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Enable or disable user (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User status updated', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(id, dto, user.sub);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reset user password and return temporary password (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Temporary password generated', type: ResetUserPasswordResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResetUserPasswordResponseDto> {
    return this.usersService.resetPassword(id, user.sub);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.usersService.delete(id, user.sub);
  }
}
