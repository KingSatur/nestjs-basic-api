import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto/auth.dto';

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
    describe('Edit user', () => {});
  });

  describe('Bookmarks', () => {
    describe('Get bookmark by id', () => {});
    describe('Create bookmark', () => {});
    describe('Delete bookmark', () => {});
    describe('Edit bookmark', () => {});
  });
});
