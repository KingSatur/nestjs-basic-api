import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto/auth.dto';
import { UserDto } from '../src/user/model/user.dto';
import { CreateBookmarkDto } from '../src/bookmark/dto';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      })
    );
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'hola@messi.com',
      password: '123123',
    };
    describe('SignUp', () => {
      it('Should throw exception if email empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: '12',
          })
          .expectStatus(400);
      });
      it('Should throw exception if password empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: '12',
          })
          .expectStatus(400);
      });
      it('Should throw exception if both password and email are empty', () => {
        return pactum.spec().post('/auth/signup').withBody({}).expectStatus(400);
      });
      it('Should sign up', () => {
        return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201);
      });
    });
    describe('SignIng', () => {
      it('Should log in', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .get('/user')
          .expectStatus(200)
          .inspect();
      });
    });
    describe('Edit user', () => {
      it('Should edit user', () => {
        const id = 1;
        const userDto: UserDto = new UserDto();
        userDto.email = 'leo@mail.come';
        userDto.firstName = 'Penaldo';
        userDto.lastName = 'Leo';
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .patch(`/user/${id}`)
          .withBody(userDto)
          .expectStatus(200)
          .expectBodyContains(userDto.firstName)
          .expectBodyContains(userDto.email)
          .expectBodyContains(userDto.lastName);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Create bookmark', () => {
      it('Should create bookmark', () => {
        const bookmarkDto: CreateBookmarkDto = new CreateBookmarkDto();
        bookmarkDto.link = '1123123';
        bookmarkDto.title = 'Libro de messi';
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .post(`/bookmark`)
          .withBody(bookmarkDto)
          .expectStatus(201)
          .inspect()
          .expectBodyContains(bookmarkDto.link)
          .expectBodyContains(bookmarkDto.title)
          .stores('bookMarkId', 'id');
      });
    });
    describe('Get bookmark by id', () => {
      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .get(`/bookmark/$S{bookMarkId}`)
          .expectStatus(200)
          .inspect();
      });
    });
    describe('Get bookmarks', () => {
      it('Should create bookmark', () => {
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .get(`/bookmark`)
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Edit bookmark', () => {
      it('Should edit bookmark', () => {
        const bookmarkDto: CreateBookmarkDto = new CreateBookmarkDto();
        bookmarkDto.link = 'http liverpool';
        bookmarkDto.title = 'Libro de ronaldo';
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .put(`/bookmark/{id}`)
          .withBody(bookmarkDto)
          .withPathParams('id', '$S{bookMarkId}')
          .expectStatus(200)
          .expectBodyContains('Libro de ronaldo')
          .expectBodyContains('http liverpool')
          .inspect();
      });
    });
    describe('Delete bookmark', () => {
      it('Should delete bookmark', () => {
        return pactum
          .spec()
          .withHeaders('Authorization', 'Bearer $S{userAt}')
          .delete(`/bookmark/{id}`)
          .withPathParams('id', '$S{bookMarkId}')
          .expectStatus(204);
      });
    });
  });
});
