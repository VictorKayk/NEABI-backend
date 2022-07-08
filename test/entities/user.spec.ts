import { User } from '@/entities';
import { InvalidNameError, InvalidEmailError, InvalidPasswordError } from '@/entities/errors';

describe('User Entity', () => {
  it('Should create an user on success', () => {
    const userOrError = User.create('any_name', 'any_email@test.com', 'any_password_1');
    expect(userOrError.isSuccess()).toBe(true);
    const user = userOrError.value as User;
    expect(user.name.value).toEqual('any_name');
    expect(user.email.value).toEqual('any_email@test.com');
    expect(user.password.value).toEqual('any_password_1');
  });

  it('Should return an error if name is invalid', () => {
    const error = User.create('', 'any_email@test.com', 'any_password_1');
    expect(error.isSuccess()).toBe(true);
    expect(error.value).toEqual(new InvalidNameError(''));
  });

  it('Should create an error if email is invalid', () => {
    const error = User.create('any_name', '', 'any_password_1');
    expect(error.isSuccess()).toBe(true);
    expect(error.value).toEqual(new InvalidEmailError(''));
  });

  it('Should create an error if password is invalid', () => {
    const error = User.create('any_name', 'any_email@test.com', '');
    expect(error.isSuccess()).toBe(true);
    expect(error.value).toEqual(new InvalidPasswordError(''));
  });
});