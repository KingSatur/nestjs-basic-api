import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
@UseGuards(JwtGuard) // --> Using guardaat class level
@Controller('user')
export class UserController {
  //@UseGuards(JwtGuard) // --> Using guard at method level
  @Get()
  getMe(@GetUser('') user: User) {
    return user;
  }
}
