import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators';
import { JwtPayload } from '../strategies/jwt.strategy';
import { ErrorCodes } from '../../../common/errors/error-codes';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_MISSING_AUTH_HEADER,
        message: 'No authorization header',
      });
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = JwtPayload>(err: Error | null, user: TUser): TUser {
    if (err) {
      this.logger.error(`Auth error: ${err.message}`);
      throw err;
    }
    if (!user) {
      this.logger.warn('No user from JWT');
      throw new UnauthorizedException({
        code: ErrorCodes.AUTH_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }
    return user;
  }
}
