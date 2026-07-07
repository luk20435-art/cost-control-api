import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['cc_token'] ?? null,
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret') as string,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
