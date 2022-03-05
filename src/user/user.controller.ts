import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { UserDto } from './model/user.dto';
@UseGuards(JwtGuard) // --> Using guardaat class level
@Controller('user')
export class UserController {
  //@UseGuards(JwtGuard) // --> Using guard at method level
  constructor(private readonly userService: UserService) {}

  @Get()
  getMe(@GetUser('') user: User) {
    return user;
  }

  @Patch(':id')
  editUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserDto,
    @GetUser('') user: User
  ) {
    return this.userService.editUser(user.id, dto);
  }
}
