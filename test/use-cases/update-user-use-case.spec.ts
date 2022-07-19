import { User } from '@/entities';
import { InvalidEmailError } from '@/entities/errors';
import {
  IUserRepository,
  IUserVisibleData,
  IUserRepositoryReturnData,
  IHasher,
} from '@/use-cases/interfaces';
import { ExistingUserError, NonExistingUserError } from '@/use-cases/errors';
import { UserBuilder } from '@/test/builders/user-builder';
import { makeUserRepository, makeHasher } from '@/test/stubs';
import { UpdateUserUseCase } from '@/use-cases/update-user';

type SutTypes = {
  userRepository: IUserRepository,
  hasher: IHasher
  sut: UpdateUserUseCase,
  user: UserBuilder,
  repositoryReturn: IUserRepositoryReturnData,
}

const makeSut = (): SutTypes => {
  const userRepository = makeUserRepository();
  const hasher = makeHasher();
  const sut = new UpdateUserUseCase(userRepository, hasher);
  const user = new UserBuilder();

  const repositoryReturn = {
    ...user.build(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jest.spyOn(userRepository, 'findById').mockResolvedValue(repositoryReturn);
  jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(repositoryReturn);

  return {
    userRepository,
    hasher,
    sut,
    user,
    repositoryReturn,
  };
};

describe('UpdateUserUseCase', () => {
  it('Should call user entity with correct values', async () => {
    const { sut, user } = makeSut();
    const userSpy = jest.spyOn(User, 'create');
    await sut.execute({ id: user.build().id, userData: user.build() });
    expect(userSpy)
      .toHaveBeenCalledWith({
        name: user.build().name,
        email: user.build().email,
        password: user.build().password,
      });
  });

  it('Should return an error if user do not exists', async () => {
    const { sut, user, userRepository } = makeSut();

    jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

    const response = await sut.execute({ id: user.build().id, userData: {} });

    expect(response.isError()).toBe(true);
    expect(response.value).toEqual(new NonExistingUserError());
  });

  it('Should update name', async () => {
    const {
      sut,
      user,
      userRepository,
      repositoryReturn,
    } = makeSut();

    jest.spyOn(userRepository, 'updateById').mockResolvedValue({
      ...repositoryReturn,
      name: 'new_name',
    });

    const response = await sut.execute({ id: user.build().id, userData: { name: 'new_name' } });
    const value = response.value as IUserVisibleData;

    expect(value).toEqual({
      id: repositoryReturn.id,
      name: 'new_name',
      email: repositoryReturn.email,
      accessToken: repositoryReturn.accessToken,
      createdAt: repositoryReturn.createdAt,
      updatedAt: repositoryReturn.updatedAt,
    });
  });

  it('Should update email', async () => {
    const {
      sut,
      user,
      userRepository,
      repositoryReturn,
    } = makeSut();

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(userRepository, 'updateById').mockResolvedValue({
      ...repositoryReturn,
      email: 'new_email@test.com',
    });

    const response = await sut.execute({ id: user.build().id, userData: { email: 'new_email@test.com' } });
    const value = response.value as IUserVisibleData;

    expect(value).toEqual({
      id: repositoryReturn.id,
      name: repositoryReturn.name,
      email: 'new_email@test.com',
      accessToken: repositoryReturn.accessToken,
      createdAt: repositoryReturn.createdAt,
      updatedAt: repositoryReturn.updatedAt,
    });
  });

  it('Should return an error if email is already taken', async () => {
    const { sut, user } = makeSut();

    const response = await sut.execute({ id: user.build().id, userData: { email: 'invalid_email@test.com' } });

    expect(response.isError()).toBe(true);
    expect(response.value).toEqual(new ExistingUserError());
  });

  it('Should call hasher with correct values', async () => {
    const {
      sut,
      user,
      userRepository,
      repositoryReturn,
      hasher,
    } = makeSut();

    jest.spyOn(userRepository, 'updateById').mockResolvedValue({
      ...repositoryReturn,
      password: 'new_password_1',
    });

    const hasherSpy = jest.spyOn(hasher, 'hash');

    await sut.execute({ id: user.build().id, userData: { password: 'new_password_1' } });

    expect(hasherSpy).toHaveBeenCalledWith('new_password_1');
  });

  it('Should update name, email and password', async () => {
    const {
      sut,
      user,
      userRepository,
      repositoryReturn,
    } = makeSut();

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(userRepository, 'updateById').mockResolvedValue({
      ...repositoryReturn,
      name: 'new_name',
      email: 'new_email@test.com',
      password: 'new_password_1',
    });

    const response = await sut.execute({
      id: user.build().id,
      userData: {
        name: 'new_name',
        email: 'new_email@test.com',
        password: 'new_password_1',
      },
    });
    const value = response.value as IUserVisibleData;

    expect(value).toEqual({
      id: repositoryReturn.id,
      name: 'new_name',
      email: 'new_email@test.com',
      accessToken: repositoryReturn.accessToken,
      createdAt: repositoryReturn.createdAt,
      updatedAt: repositoryReturn.updatedAt,
    });
  });

  it('Should throw if updateById throws', async () => {
    const { sut, user, userRepository } = makeSut();
    jest.spyOn(userRepository, 'updateById').mockRejectedValue(new Error());
    const promise = sut.execute({ id: user.build().id, userData: {} });
    await expect(promise).rejects.toThrow();
  });

  it('Should return user visible data on success', async () => {
    const {
      sut,
      user,
      userRepository,
      repositoryReturn,
    } = makeSut();

    jest.spyOn(userRepository, 'updateById').mockResolvedValue({
      ...repositoryReturn,
    });
    const response = await sut.execute({ id: user.build().id, userData: {} });
    const value = response.value as IUserVisibleData;

    expect(value).toEqual({
      id: repositoryReturn.id,
      name: repositoryReturn.name,
      email: repositoryReturn.email,
      accessToken: repositoryReturn.accessToken,
      createdAt: repositoryReturn.createdAt,
      updatedAt: repositoryReturn.updatedAt,
    });
  });
});
