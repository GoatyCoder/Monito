import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCodes } from '../../../common/errors/error-codes';

export interface JwtPayload {
  sub: string;
  username: string;
  role: 'USER' | 'OPERATOR' | 'ADMIN';
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new BadRequestException({
        code: ErrorCodes.AUTH_JWT_SECRET_NOT_CONFIGURED,
        message: 'JWT_SECRET is not configured',
      });
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
