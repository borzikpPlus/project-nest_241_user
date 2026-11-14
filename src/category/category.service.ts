import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity.js';
import { Repository } from 'typeorm';
import { CategoryCreateReqDto } from './dtos/category_create.req.dto.js';
import { CategoryGetResDto } from './dtos/category_get.res.dto.js';
import { CategoryUpdateReqDto } from './dtos/category_update.req.dto.js';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly _repository: Repository<Category>,
  ) {}

  async create(dto: CategoryCreateReqDto): Promise<CategoryGetResDto> {
    const category = this._repository.create({
      title: dto.title,
      slug: dto.slug,
      image: dto.image,
      is_show: true,
      parent_id: dto.parent_id,
      description: dto.description,
    });
    const result = await this._repository.save(category);
    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      image: result.image ?? '',
      parent_id: result.parent_id,
    };
  }

  async findAll(): Promise<CategoryGetResDto[]> {
    const categories = await this._repository.find();
    const result: CategoryGetResDto[] = [];
    categories.forEach((c: Category) => {
      result.push({
        id: c.id,
        title: c.title,
        slug: c.slug,
        image: c.image ?? '',
        parent_id: c.parent_id,
      });
    });
    return result;
  }

  async findById(id: number): Promise<CategoryGetResDto | undefined> {
    const category = await this._repository.findOneBy({ id });
    if (category) {
      const result: CategoryGetResDto = {
        id: category.id,
        title: category.title,
        slug: category.slug,
        image: category.image ?? '',
        parent_id: category.parent_id,
      };
      return result;
    }
  }

  async update(
    id: number,
    dto: CategoryCreateReqDto,
  ): Promise<CategoryGetResDto> {
    const category = await this._repository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    category.title = dto.title;
    category.slug = dto.slug;
    category.parent_id = dto.parent_id;
    if (dto.image !== undefined) {
      category.image = dto.image;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }
    const result = await this._repository.save(category);
    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      image: result.image ?? '',
      parent_id: result.parent_id,
    };
  }

  async patch(
    id: number,
    dto: CategoryUpdateReqDto,
  ): Promise<CategoryGetResDto> {
    const category = await this._repository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    if (dto.title !== undefined) {
      category.title = dto.title;
    }
    if (dto.slug !== undefined) {
      category.slug = dto.slug;
    }
    if (dto.parent_id !== undefined) {
      category.parent_id = dto.parent_id;
    }
    if (dto.image !== undefined) {
      category.image = dto.image;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }
    const result = await this._repository.save(category);
    return {
      id: result.id,
      title: result.title,
      slug: result.slug,
      image: result.image ?? '',
      parent_id: result.parent_id,
    };
  }

  async delete(id: number): Promise<CategoryGetResDto> {
    const category = await this._repository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this._repository.remove(category);
    return {
      id,
      title: category.title,
      slug: category.slug,
      image: category.image ?? '',
      parent_id: category.parent_id,
    };
  }
}
