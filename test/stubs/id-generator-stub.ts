import { IIdGenerator } from '@/use-cases/user/interfaces';

export const makeIdGenerator = (): IIdGenerator => {
  class IdGeneratorStub implements IIdGenerator {
    async generate(): Promise<string> {
      return 'any_id';
    }
  }
  return new IdGeneratorStub();
};
