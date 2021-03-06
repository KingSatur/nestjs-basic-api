import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { config } from 'process';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: AuthDto) {
    const user = await this.prismaService.user.findFirst({ where: { email: dto.email } });
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }
    const unlock = await argon.verify(user.hash, dto.password);
    if (!unlock) {
      throw new ForbiddenException('Incorrect credentials');
    }
    const tokenDto = await this.signToken(user?.id, user?.email);
    return tokenDto;
    // delete user.hash;
    // return user;
  }

  private async signToken(
    userId: number,
    email: string
  ): Promise<{ access_token: string }> {
    const data = {
      sub: userId,
      email,
    };
    const token = await this.jwtService.signAsync(data, {
      privateKey: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    return {
      access_token: token,
    };
  }

  async signUp(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
        },
        // select: {
        //   email: true,
        //   id: true,
        //   createdAt: true,
        // },
      });
      const tokenDto = await this.signToken(user?.id, user?.email);
      return tokenDto;
      // delete user.hash;
      // return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error?.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }
}
