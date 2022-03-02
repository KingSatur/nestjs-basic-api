import { ForbiddenException, Injectable } from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async login(dto: AuthDto) {
    const user = await this.prismaService.user.findFirst({ where: { email: dto.email } });
    if (!user) {
      throw new ForbiddenException('Incorrect credentials');
    }
    const unlock = await argon.verify(user.hash, dto.password);

    if (!unlock) {
      throw new ForbiddenException('Incorrect credentials');
    }

    delete user.hash;
    return user;
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

      delete user.hash;

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error?.code === 'P2002') {
        throw new ForbiddenException('Credentials taken');
      }
      throw error;
    }
  }
}
