import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserReqDto } from './dto/create-user.req.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserGetResDto } from './dto/user_get.res.dto.js';
import { HashHelper } from '../helpers/hash.helper.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly _repository: Repository<User>,
    private readonly _hashHelper: HashHelper,
  ) {}

  async create(createUserDto: CreateUserReqDto) {
    const user = await this._repository.findOne({
      where: {
        email: createUserDto.email,
      },
    });
    if (user != null) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    const hash = await this._hashHelper.hash(createUserDto.password);
    const result = this._repository.create({
      fullname: createUserDto.fullname,
      email: createUserDto.email,
      is_block: createUserDto.is_block,
      password_hash: hash,
      role: { id: 2 },
    });
    const savedUser = await this._repository.save(result);

    return {
      id: savedUser.id,
      email: savedUser.email,
      fullname: savedUser.fullname,
      is_block: savedUser.is_block,
    };
  }

  async validateCredentials(email: string, password: string) {
    const user = await this._repository.findOne({ where: { email } });
    if (!user || user.is_block) {
      return null;
    }

    const isValid = await this._hashHelper.isValidPassword(
      password,
      user.password_hash,
    );
    return isValid ? { id: user.id, email: user.email } : null;
  }

  async hasRole(userId: number, roleName: string): Promise<boolean> {
    const user = await this._repository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    return user?.role?.name === roleName;
  }

  async findAll(): Promise<UserGetResDto[]> {
    const users = await this._repository.find({
      relations: { role: true },
      order: { id: 'ASC' },
    });
    return users.map((u: User) => this.toDto(u));
  }

  async findOne(id: number): Promise<UserGetResDto> {
    const user = await this._repository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return this.toDto(user);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserGetResDto> {
    const user = await this._repository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
      const exists = await this._repository.findOneBy({
        email: updateUserDto.email,
      });
      if (exists) {
        throw new ConflictException('Користувач з таким email вже існує');
      }
      user.email = updateUserDto.email;
    }
    if (updateUserDto.fullname !== undefined) {
      user.fullname = updateUserDto.fullname;
    }
    if (updateUserDto.is_block !== undefined) {
      user.is_block = updateUserDto.is_block;
    }
    if (updateUserDto.password !== undefined) {
      user.password_hash = await this._hashHelper.hash(updateUserDto.password);
    }
    const result = await this._repository.save(user);
    return this.toDto(result);
  }

  async remove(id: number): Promise<UserGetResDto> {
    const user = await this._repository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    await this._repository.remove(user);
    return this.toDto({ ...user, id });
  }

  private toDto(user: User): UserGetResDto {
    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      is_block: user.is_block,
      role: user.role?.name ?? null,
    };
  }
}
