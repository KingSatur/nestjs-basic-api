import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBookmarks(userId: number) {
    const bookmarks = await this.prismaService.bookmark.findMany({
      where: {
        userId,
      },
    });
    return bookmarks;
  }

  getBookmarkById(userId: number, bookmarkId: number) {
    return this.prismaService.bookmark.findFirst({
      where: {
        id: bookmarkId,
        userId,
      },
    });
  }

  createBookmark(userId: number, dto: CreateBookmarkDto) {
    return this.prismaService.bookmark.create({
      data: { userId, ...dto },
    });
  }

  async editBookmark(userId: number, bookMarkId: number, dto: EditBookmarkDto) {
    const bookMark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookMarkId,
      },
    });

    if (bookMark?.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prismaService.bookmark.update({
      where: {
        id: bookMarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookmarkById(userId: number, bookMarkId: number) {
    const bookMark = await this.prismaService.bookmark.findUnique({
      where: {
        id: bookMarkId,
      },
    });

    if (bookMark?.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prismaService.bookmark.delete({
      where: {
        id: bookMarkId,
      },
    });
  }
}
