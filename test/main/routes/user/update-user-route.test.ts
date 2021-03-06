import request from 'supertest';
import app from '@/main/config/app';
import prisma from '@/main/config/prisma';
import { UserBuilder } from '@/test/builders/user-builder';

type SutTypes = {
  user: UserBuilder,
};

const makeSut = (): SutTypes => {
  const user = new UserBuilder();
  return {
    user,
  };
};

jest.mock('@/test/mocks/prisma-client.ts');

jest.mock('bcrypt', () => ({
  async hash(): Promise<string> {
    return new Promise((resolve) => resolve('hashed_password'));
  },
  async compare(hash: string, value: string): Promise<boolean> {
    return new Promise((resolve) => resolve(true));
  },
}));

jest.mock('jsonwebtoken', () => ({
  async sign(): Promise<string> {
    return new Promise((resolve) => resolve('any_encrypted_string'));
  },
  verify() {
    return { id: 'any_id' };
  },
}));

describe('UpdateUser Route', () => {
  it('Should return 200 on update user route success', async () => {
    const { user } = makeSut();

    jest.spyOn(prisma.user, 'findFirst')
      .mockResolvedValueOnce({
        ...user.build(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        ...user.build(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null);

    jest.spyOn(prisma.user, 'update').mockResolvedValue({
      ...user.build(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app).patch('/api/user')
      .set('x-access-token', user.build().accessToken)
      .send({
        name: 'new_name',
        email: 'new_email@test.com',
        password: 'new_password_1',
      })
      .expect(200);
  });

  it('Should return 400 on update user route if params are invalid', async () => {
    const { user } = makeSut();

    jest.spyOn(prisma.user, 'findFirst')
      .mockResolvedValueOnce({
        ...user.build(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        ...user.build(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null);

    await request(app).patch('/api/user')
      .set('x-access-token', user.build().accessToken)
      .send({
        name: '',
        email: '',
        password: '',
      })
      .expect(400);
  });

  it('Should return 403 on update user route if user do not exists', async () => {
    const { user } = makeSut();

    jest.spyOn(prisma.user, 'findFirst')
      .mockResolvedValueOnce({
        ...user.build(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null);

    await request(app).patch('/api/user')
      .set('x-access-token', user.build().accessToken)
      .send({
        name: 'new_name',
        email: 'new_email@test.com',
        password: 'new_password_1',
      })
      .expect(403);
  });

  it('Should return 403 on update user route if user exists', async () => {
    const { user } = makeSut();

    jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
      ...user.build(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app).patch('/api/user')
      .set('x-access-token', user.build().accessToken)
      .send({
        name: 'new_name',
        email: 'new_email@test.com',
        password: 'new_password_1',
      })
      .expect(403);
  });

  it('Should return 500 if update user route throws', async () => {
    const { user } = makeSut();

    jest.spyOn(prisma.user, 'findFirst').mockResolvedValueOnce({
      ...user.build(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).mockImplementationOnce(() => { throw new Error(); });

    await request(app).patch('/api/user')
      .set('x-access-token', user.build().accessToken)
      .send({
        name: 'new_name',
        email: 'new_email@test.com',
        password: 'new_password_1',
      })
      .expect(500);
  });
});
