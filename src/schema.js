// Chuyển đổi giữa model trong app (không prefix) <-> dữ liệu lưu trên MockAPI (field có prefix MSSV_)
import { P } from './config';

const apiId = (record) => {
  if (record?.id == null || String(record.id).trim() === '') {
    throw new Error('MockAPI record is missing its id');
  }
  return String(record.id);
};

export const categoryToApi = (c) => ({
  [`${P}Name`]: c.name,
  [`${P}Description`]: c.description,
});

export const categoryFromApi = (r) => ({
  id: apiId(r),
  name: r[`${P}Name`] ?? '',
  description: r[`${P}Description`] ?? '',
});

export const dishToApi = (d) => ({
  [`${P}Name`]: d.name,
  [`${P}Price`]: d.price,
  [`${P}PreparationTime`]: d.preparationTime,
  [`${P}IsAvailable`]: d.isAvailable,
  [`${P}Description`]: d.description,
  [`${P}DishCategoryId`]: d.categoryId,
  [`${P}DishImage`]: (d.images || []).map((i) => ({
    [`${P}ImageUrl`]: i.imageUrl,
    [`${P}IsThumbnail`]: i.isThumbnail,
  })),
});

export const dishFromApi = (r) => ({
  id: apiId(r),
  name: r[`${P}Name`] ?? '',
  price: Number(r[`${P}Price`]) || 0,
  preparationTime: Number(r[`${P}PreparationTime`]) || 0,
  isAvailable: !!r[`${P}IsAvailable`],
  description: r[`${P}Description`] ?? '',
  categoryId: String(r[`${P}DishCategoryId`] ?? ''),
  images: Array.isArray(r[`${P}DishImage`])
    ? r[`${P}DishImage`].map((i) => ({
        imageUrl: i[`${P}ImageUrl`] ?? '',
        isThumbnail: !!i[`${P}IsThumbnail`],
      }))
    : [],
});
