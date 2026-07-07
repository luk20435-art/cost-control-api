import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private validateCredentials(username: string, password: string): boolean {
    const admin = this.configService.get<{
      username: string;
      password?: string;
      passwordHash?: string;
    }>('admin');

    if (!admin || username !== admin.username) {
      return false;
    }

    if (admin.passwordHash) {
      return bcrypt.compareSync(password, admin.passwordHash);
    }

    return password === admin.password;
  }

  login(username: string, password: string): { token: string; user: { username: string } } {
    if (!username || !password) {
      throw new BadRequestException('Username and password are required');
    }

    if (!this.validateCredentials(username, password)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload: JwtPayload = { sub: username, username };
    const token = this.jwtService.sign(payload);

    return { token, user: { username } };
  }

  getProfile(payload: JwtPayload): { username: string } {
    return { username: payload.username };
  }
}
