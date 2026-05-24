import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Attempt JWT parsing so req.user is populated when a valid token exists
      // (needed for schoolId-based filtering on public GET endpoints).
      // If no token or bad token, silently allow the request through anyway.
      const result = super.canActivate(context);
      if (result instanceof Promise) {
        return result.catch(() => true);
      }
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // On public routes: silently allow even if auth fails (no token / invalid token)
    if (isPublic) {
      return user || null;
    }

    // On protected routes: throw if auth fails
    if (err || !user) {
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException(
            info?.message || 'Unauthorized - Invalid or missing token',
          );
    }
    return user;
  }
}
