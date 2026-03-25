import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  username: string;
  role: 'USER' | 'ADMIN';
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.debug(`JWT Strategy initialized with secret: ${secret.substring(0, 10)}...`);
  }

  validate(payload: JwtPayload): JwtPayload {
    this.logger.debug(`Validated payload: ${JSON.stringify(payload)}`);
    return payload;
  }
}
