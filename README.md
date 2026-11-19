# Wedding Planner

Nền tảng quản lý đám cưới 2 phía: công ty/wedding planner (quản lý nhiều dự án, nhân viên, nhà cung cấp) và cặp đôi khách hàng (xem tiến độ, ngân sách, khách mời).

## Cấu trúc dự án

```
wed-planing/
├── backend/   # Node.js + Express + Prisma (MySQL)
└── frontend/  # React + Vite
```

## Tính năng đã scaffold (MVP)

- Đăng ký công ty + tài khoản admin, đăng nhập (JWT)
- Quản lý danh sách đám cưới theo tổ chức (multi-tenant)
- Checklist công việc (task) theo từng đám cưới
- Ngân sách theo hạng mục (budget items)
- Danh sách khách mời + trạng thái RSVP
- Danh bạ nhà cung cấp (vendor)

## Chạy backend

1. Cài MySQL, tạo database `wedding_planner`.
2. Copy `.env.example` thành `.env` và điền `DATABASE_URL`, `JWT_SECRET`.
3. Cài đặt & chạy migration:

```powershell
cd backend
npm install
npm run prisma:migrate
npm run dev
```

API chạy ở `http://localhost:4000`.

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Web chạy ở `http://localhost:5173`, request `/api/*` được proxy sang backend.

## Bước tiếp theo (gợi ý)

- Thêm trang CRM/báo giá/hợp đồng cho planner
- Trang mini-site công khai cho khách mời (RSVP không cần đăng nhập)
- Sơ đồ bàn tiệc kéo-thả
- App mobile (React Native) tái sử dụng API hiện có
- Phân quyền chi tiết hơn (STAFF, CLIENT) trên từng route
