# Agenda+ Backend API

Agenda+ 後端服務，提供 RESTful API 接口。

## 功能特性

- ✅ 用戶認證（JWT）
- ✅ 課程表管理
- ✅ 任務/作業管理
- ✅ 人員關係管理
- ✅ 想法/日記管理
- ✅ 用戶資料管理
- ✅ 圖片上傳（Base64，最大 375KB）
- ✅ 分頁查詢支持
- ✅ 內存優化

## 技術棧

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## 快速開始

### 安裝依賴

```bash
npm install
```

### 環境變量

創建 `.env` 文件：

```env
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your_secret_key_here
NODE_ENV=production
```

### 運行服務

```bash
# 開發模式
node index.js

# 生產模式（使用 PM2）
pm2 start index.js --name agenda-backend
```

## API 文檔

### 認證

- `POST /api/auth/register` - 註冊
- `POST /api/auth/login` - 登錄

### 課程

- `GET /api/courses` - 獲取課程列表
- `POST /api/courses` - 創建課程
- `PUT /api/courses/:id` - 更新課程
- `DELETE /api/courses/:id` - 刪除課程

### 任務

- `GET /api/tasks` - 獲取任務列表（支持分頁）
- `POST /api/tasks` - 創建任務
- `PUT /api/tasks/:id` - 更新任務
- `PATCH /api/tasks/:id/toggle` - 切換完成狀態
- `DELETE /api/tasks/:id` - 刪除任務

### 人員關係

- `GET /api/contacts?page=1&limit=50` - 獲取人員列表（分頁）
- `POST /api/contacts` - 創建人員
- `PUT /api/contacts/:id` - 更新人員
- `DELETE /api/contacts/:id` - 刪除人員

### 想法

- `GET /api/thoughts?page=1&limit=50` - 獲取想法列表（分頁）
- `POST /api/thoughts` - 創建想法
- `DELETE /api/thoughts/:id` - 刪除想法

### 用戶資料

- `GET /api/user/me` - 獲取當前用戶資料
- `PUT /api/user/me` - 更新用戶資料

## 內存優化

- 請求體大小限制：2MB
- Base64 圖片大小限制：500KB（≈375KB 原圖）
- 分頁查詢：默認每頁 50 條，最多 100 條
- 生產環境關閉 SQLite verbose 日誌

## 部署

詳見 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 許可證

MIT
