export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  avatarColor?: AvatarColor;
  createdAt: Date;
  updatedAt?: Date;
}

export type AvatarColor = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'pink' | 'gray';

export interface CreateUserDto {
  username: string;
  password: string;
  firstName: string;
  surname: string;
  role?: Role;
}

export interface UpdateUserDto {
  username?: string;
  firstName?: string;
  surname?: string;
  role?: Role;
  avatarColor?: AvatarColor;
  password?: string;
}

export interface UserResponseDto {
  id: string;
  username: string;
  firstName: string;
  surname: string;
  role: Role;
  avatarColor?: AvatarColor;
  createdAt: Date;
  updatedAt?: Date;
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}