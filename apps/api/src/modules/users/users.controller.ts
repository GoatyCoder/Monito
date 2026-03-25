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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponse } from '../../common/interceptors/transform.interceptor';
import { RolesGuard, Roles } from '../auth/guards';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Role } from '../../../generated/prisma/client';

@ApiTags('users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
