import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  async validate(payload: {
    sub: string;
    role: string;
    schoolId?: string;
    classIds?: string[];
    sectionIds?: string[];
  }) {
    // req.user will have all these fields available to controllers
    return {
      id: payload.sub,
      userId: payload.sub, // keep backward compat with anything reading userId
      role: payload.role,
      schoolId: payload.schoolId || null,
      classIds: payload.classIds || [],
      sectionIds: payload.sectionIds || [],
    };
  }
}
