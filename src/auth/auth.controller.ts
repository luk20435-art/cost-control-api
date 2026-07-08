import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayload } from './types/jwt-payload.interface';

const COOKIE_NAME = 'cc_token';

function expiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    return 24 * 60 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return value * (unitMs ?? 86_400_000);
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  login(@Req() req: { body: LoginDto }, @Res({ passthrough: true }) res: Response) {
    const { username, password } = req.body;
    const { token, user } = this.authService.login(username, password);

    const secure = this.configService.get('cookie.secure') as boolean;
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: secure ? 'none' : 'lax',
      secure,
      maxAge: expiresInToMs(this.configService.get('jwt.expiresIn') as string),
      path: '/',
    });

    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: { user: JwtPayload }) {
    return this.authService.getProfile(req.user);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const secure = this.configService.get('cookie.secure') as boolean;
    res.clearCookie(COOKIE_NAME, {
      path: '/',
      sameSite: secure ? 'none' : 'lax',
      secure,
    });
    return { success: true };
  }
}
