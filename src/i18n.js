// Đa ngôn ngữ tự viết: English (mặc định) <-> Tiếng Việt. Ngôn ngữ nằm trong Context nên được giữ khi chuyển màn hình.
import React, { createContext, useCallback, useContext, useState } from 'react';

const dict = {
  en: {
    dishes: 'Dishes', dishDetail: 'Dish details', addDish: 'Add dish', editDish: 'Edit dish',
    categories: 'Categories', addCategory: 'Add category', loading: 'Loading…',
    search: 'Search by dish name', all: 'All', availableOnly: 'Available only',
    minPrice: 'Min price', maxPrice: 'Max price', sort: 'Sort', sortNone: 'Default',
    sortPriceAsc: 'Price ↑', sortPriceDesc: 'Price ↓', sortTimeAsc: 'Time ↑',
    priceRangeInvalid: 'Invalid price range (price filter ignored)', noDishes: 'No dishes found',
    name: 'Name', price: 'Price', prepTime: 'Preparation time (min)', description: 'Description',
    category: 'Category', available: 'Available', unavailable: 'Unavailable', minutes: 'min',
    quick: 'Quick', regular: 'Regular', save: 'Save', delete: 'Delete', edit: 'Edit', back: 'Back',
    confirmDeleteTitle: 'Confirm delete', confirmDeleteMsg: 'Delete "{name}"?', cancel: 'Cancel',
    images: 'Images', noImages: 'No images', imageUrl: 'Image URL', addImage: 'Add image',
    thumbnail: 'Thumbnail', setThumbnail: 'Set as thumbnail',
    dishNotFound: 'Dish not found', noCategories: 'No categories yet. Add a category first.',
    noCategoryList: 'No categories',
    nameRequired: 'Name is required', priceInvalid: 'Price must be greater than 0',
    prepInvalid: 'Preparation time must be greater than 0', categoryInvalid: 'Please choose a valid category',
    nameDuplicate: 'A dish with this name already exists in this category',
    imageUrlInvalid: 'Enter a valid image URL (http/https)',
    categoryInUse: 'This category is in use by some dishes and cannot be deleted',
    online: 'Online', offline: 'Offline – changes are saved locally and will sync automatically',
    syncing: 'Syncing…', syncError: 'Cannot reach MockAPI. Will retry automatically.',
    pending: '{n} pending change(s)', error: 'Error',
  },
  vi: {
    dishes: 'Món ăn', dishDetail: 'Chi tiết món ăn', addDish: 'Thêm món', editDish: 'Sửa món',
    categories: 'Loại món', addCategory: 'Thêm loại món', loading: 'Đang tải…',
    search: 'Tìm theo tên món', all: 'Tất cả', availableOnly: 'Chỉ món đang bán',
    minPrice: 'Giá từ', maxPrice: 'Giá đến', sort: 'Sắp xếp', sortNone: 'Mặc định',
    sortPriceAsc: 'Giá ↑', sortPriceDesc: 'Giá ↓', sortTimeAsc: 'Thời gian ↑',
    priceRangeInvalid: 'Khoảng giá không hợp lệ (bỏ qua lọc giá)', noDishes: 'Không có món ăn nào',
    name: 'Tên', price: 'Giá', prepTime: 'Thời gian chế biến (phút)', description: 'Mô tả',
    category: 'Loại món', available: 'Đang bán', unavailable: 'Ngừng bán', minutes: 'phút',
    quick: 'Nhanh', regular: 'Thông thường', save: 'Lưu', delete: 'Xóa', edit: 'Sửa', back: 'Quay lại',
    confirmDeleteTitle: 'Xác nhận xóa', confirmDeleteMsg: 'Xóa "{name}"?', cancel: 'Hủy',
    images: 'Hình ảnh', noImages: 'Chưa có ảnh', imageUrl: 'Đường dẫn ảnh', addImage: 'Thêm ảnh',
    thumbnail: 'Ảnh đại diện', setThumbnail: 'Đặt làm ảnh đại diện',
    dishNotFound: 'Không tìm thấy món ăn', noCategories: 'Chưa có loại món. Hãy thêm loại món trước.',
    noCategoryList: 'Chưa có loại món',
    nameRequired: 'Tên không được để trống', priceInvalid: 'Giá phải lớn hơn 0',
    prepInvalid: 'Thời gian chế biến phải lớn hơn 0', categoryInvalid: 'Vui lòng chọn loại món hợp lệ',
    nameDuplicate: 'Tên món đã tồn tại trong loại món này',
    imageUrlInvalid: 'Nhập đường dẫn ảnh hợp lệ (http/https)',
    categoryInUse: 'Loại món đang được sử dụng, không thể xóa',
    online: 'Trực tuyến', offline: 'Ngoại tuyến – thay đổi được lưu trên máy và sẽ tự đồng bộ',
    syncing: 'Đang đồng bộ…', syncError: 'Không kết nối được MockAPI. Sẽ tự thử lại.',
    pending: '{n} thay đổi đang chờ', error: 'Lỗi',
  },
};

const Ctx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en'); // mặc định English
  const t = useCallback(
    (key, params) => {
      let s = dict[lang][key] ?? dict.en[key] ?? key;
      if (params) Object.keys(params).forEach((k) => (s = s.replace(`{${k}}`, params[k])));
      return s;
    },
    [lang]
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
