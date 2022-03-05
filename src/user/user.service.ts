import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserDto } from './model';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async editUser(userId: number, dto: UserDto) {
    const user = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: { ...dto },
    });

    delete user?.hash;
    return user;
  }
}
