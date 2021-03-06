import { User } from '@/entities/user';
import { InvalidNameError, InvalidEmailError } from '@/entities/value-object/errors';
import {
  IIdGenerator,
  IUseCase,
  IUserData,
  IUserVisibleData,
  IUserRepository,
  IEncrypter,
  IUserRepositoryReturnData,
} from '@/use-cases/user/interfaces';
import { getUserVisibleData } from '@/use-cases/user/util';
import { Either, error, success } from '@/shared';

type Response = Either<
  InvalidNameError |
  InvalidEmailError,
  IUserVisibleData
>;

export class ExternalSignInUseCase implements IUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly encrypter: IEncrypter,
  ) { }

  async execute({ name, email }: IUserData): Promise<Response> {
    const userOrError = User.create({ name, email });
    if (userOrError.isError()) return error(userOrError.value);

    let userData: IUserRepositoryReturnData;
    let userOrNull = await this.userRepository.findByEmail(email);

    if (userOrNull) {
      const accessToken = await this.encrypter.encrypt(userOrNull.id);

      userData = await this.userRepository.updateByEmail(email, {
        accessToken,
      });
    } else {
      let id: string;
      do {
        id = await this.idGenerator.generate();
        userOrNull = await this.userRepository.findById(id);
      } while (userOrNull);

      const accessToken = await this.encrypter.encrypt(id);

      userData = await this.userRepository.add({
        id,
        name,
        email,
        accessToken,
      });
    }

    const userVisibleData = getUserVisibleData(userData);
    return success(userVisibleData);
  }
}
