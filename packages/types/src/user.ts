export type Role = 'USER' | 'OPERATOR' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarColor?: AvatarColor;
  createdAt: Date;
  updatedAt?: Date;
}

export type AvatarColor = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'pink' | 'gray';

export interface CreateUserDto {
  username: string;
  firstName: string;
  surname: string;
  role?: Role;
}

export interface CreateUserResponse {
  user: UserResponseDto;
  temporaryPassword: string;
}

export interface UpdateUserDto {
  username?: string;
  firstName?: string;
  surname?: string;
  role?: Role;
  avatarColor?: AvatarColor;
  password?: string;
}

export interface UpdateMeDto {
  username?: string;
  firstName?: string;
  surname?: string;
  avatarColor?: AvatarColor;
}

export interface UserPreferences {
  masterDataPageSize: 10 | 20 | 50 | 100;
  auditLogPageSize: 10 | 20 | 50 | 100;
}

export interface UpdateUserPreferencesDto {
  masterDataPageSize?: 10 | 20 | 50 | 100;
  auditLogPageSize?: 10 | 20 | 50 | 100;
}

export interface UserResponseDto {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarColor?: AvatarColor;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ResetUserPasswordResponse {
  temporaryPassword: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
