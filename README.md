# BIT240216_FoodManager (React Native - Expo)

## 1. Tạo MockAPI (https://mockapi.io)
Tạo project, rồi 2 resource (tên có tiền tố MSSV):

**BIT240216_DishCategory**: `BIT240216_Name` (string), `BIT240216_Description` (string)

**BIT240216_Dish**: `BIT240216_Name` (string), `BIT240216_Price` (number), `BIT240216_PreparationTime` (number),
`BIT240216_IsAvailable` (boolean), `BIT240216_Description` (string), `BIT240216_DishCategoryId` (string),
`BIT240216_DishImage` (object/array: mỗi phần tử có `BIT240216_ImageUrl`, `BIT240216_IsThumbnail`)

Copy Base URL (dạng `https://xxxx.mockapi.io/api/v1`) dán vào `BASE_URL` trong `src/config.js`.

## 2. Cài đặt và chạy

Thư mục này đã có cấu hình Expo và các thư viện cần thiết. Tại thư mục dự án, chạy:

```
npm install
npm start
```

Mở app **Expo Go** trên điện thoại, quét mã QR (điện thoại và máy tính cùng Wi-Fi).

Nếu tạo lại project từ đầu, dùng Expo blank template, chép `App.js` và thư mục `src/` của bản này vào, rồi cài các thư viện theo lệnh:

```
npx expo install @react-native-async-storage/async-storage @react-native-community/netinfo @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

## 3. Demo offline
Bật chế độ máy bay -> thêm/sửa món -> tắt chế độ máy bay -> app tự đồng bộ lên MockAPI (không có nút Đồng bộ).
