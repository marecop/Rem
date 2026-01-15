# 快速啟動指南

## 服務器信息

- **公網IP**: `98.159.109.110`
- **API地址**: `http://98.159.109.110:3000/api`

## 在服務器上快速部署

### 1. 克隆代碼

```bash
cd /opt
sudo mkdir -p agenda-backend
sudo chown $USER:$USER agenda-backend
cd agenda-backend
git clone https://github.com/marecop/Rem.git .
cd backend
```

### 2. 安裝依賴

```bash
npm install --production
```

### 3. 配置環境變量

```bash
# 生成JWT密鑰
JWT_SECRET=$(openssl rand -base64 32)

# 創建.env文件
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PUBLIC_IP=98.159.109.110
EOF

chmod 600 .env
```

### 4. 啟動服務

```bash
# 使用PM2啟動
pm2 start index.js --name agenda-backend

# 設置開機自啟
pm2 startup
pm2 save
```

### 5. 檢查服務狀態

```bash
# 檢查PM2狀態
pm2 status

# 檢查端口
sudo netstat -tlnp | grep 3000

# 測試API
curl http://localhost:3000/
```

### 6. 配置防火牆（如果需要）

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 客戶端配置

### iOS/iPadOS

iOS應用的API地址已配置為：`http://98.159.109.110:3000/api`

如果需要修改，請編輯 `Rem/Rem/RemApp.swift` 中的 `APIService.baseURL`。

### Web前端

Web前端使用相對路徑 `/api`，如果前端和後端部署在同一服務器，無需修改。

如果前端部署在不同服務器，需要修改 `frontend/src/services/api.js`：

```javascript
const api = axios.create({
  baseURL: 'http://98.159.109.110:3000/api',
});
```

## 驗證部署

### 測試API連接

```bash
# 測試根路徑
curl http://98.159.109.110:3000/

# 測試註冊（會返回錯誤，因為需要參數，但可以驗證服務正常）
curl -X POST http://98.159.109.110:3000/api/auth/register
```

### 從客戶端測試

1. **iOS**: 打開應用，嘗試登錄或註冊
2. **Web**: 訪問前端地址，嘗試登錄

## 常見問題

### 無法連接服務器

1. 檢查服務器防火牆是否開放3000端口
2. 檢查PM2進程是否運行：`pm2 status`
3. 檢查服務器日誌：`pm2 logs agenda-backend`

### 連接被拒絕

1. 確認服務器監聽在 `0.0.0.0` 而不是 `localhost`
2. 檢查 `.env` 文件中的 `HOST=0.0.0.0`

### SSL/HTTPS（可選）

如果需要HTTPS，請參考 `DEPLOYMENT.md` 中的SSL配置部分。

## 下一步

- 配置Nginx反向代理（見 `DEPLOYMENT.md`）
- 設置SSL證書
- 配置數據庫備份
- 設置監控告警
