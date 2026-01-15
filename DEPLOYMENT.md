# Agenda+ 後端部署指南

本文檔提供 Agenda+ 後端在 Linux 服務器上的部署方案。

## 目錄

1. [服務器要求](#服務器要求)
2. [部署步驟](#部署步驟)
3. [使用 PM2 管理進程](#使用-pm2-管理進程)
4. [使用 Nginx 反向代理](#使用-nginx-反向代理)
5. [配置 SSL/HTTPS](#配置-sslhttps)
6. [監控和維護](#監控和維護)

## 服務器要求

- **操作系統**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Node.js**: v18+ 或 v20+
- **內存**: 至少 512MB（推薦 1GB+）
- **磁盤**: 至少 1GB 可用空間
- **網絡**: 開放端口 3000（或自定義端口）

## 部署步驟

### 1. 安裝 Node.js

#### Ubuntu/Debian

```bash
# 使用 NodeSource 安裝 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 驗證安裝
node --version
npm --version
```

#### CentOS/RHEL

```bash
# 使用 NodeSource 安裝 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 驗證安裝
node --version
npm --version
```

### 2. 克隆代碼

```bash
# 創建應用目錄
sudo mkdir -p /opt/agenda-backend
sudo chown $USER:$USER /opt/agenda-backend

# 克隆倉庫
cd /opt/agenda-backend
git clone https://github.com/marecop/Rem.git .

# 進入後端目錄
cd backend
```

### 3. 安裝依賴

```bash
npm install --production
```

### 4. 配置環境變量

```bash
# 創建 .env 文件
cat > .env << EOF
PORT=3000
HOST=0.0.0.0
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# 保護 .env 文件
chmod 600 .env
```

### 5. 初始化數據庫

數據庫會在首次運行時自動創建，無需手動初始化。

### 6. 測試運行

```bash
# 測試服務是否正常啟動
node index.js
```

按 `Ctrl+C` 停止測試。

## 使用 PM2 管理進程

### 安裝 PM2

```bash
sudo npm install -g pm2
```

### 啟動應用

```bash
# 在 backend 目錄下
pm2 start index.js --name agenda-backend

# 設置開機自啟
pm2 startup
pm2 save
```

### PM2 常用命令

```bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs agenda-backend

# 重啟應用
pm2 restart agenda-backend

# 停止應用
pm2 stop agenda-backend

# 刪除應用
pm2 delete agenda-backend

# 監控
pm2 monit
```

### 配置 PM2 生態系統文件（可選）

創建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'agenda-backend',
    script: 'index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};
```

使用配置文件啟動：

```bash
pm2 start ecosystem.config.js
```

## 使用 Nginx 反向代理

### 安裝 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

### 配置 Nginx

創建配置文件 `/etc/nginx/sites-available/agenda-backend`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替換為您的域名或 IP

    # 日誌
    access_log /var/log/nginx/agenda-backend-access.log;
    error_log /var/log/nginx/agenda-backend-error.log;

    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超時設置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 限制請求體大小（與後端一致）
    client_max_body_size 2M;
}
```

### 啟用配置

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/agenda-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# CentOS/RHEL（配置文件路徑不同）
sudo cp /etc/nginx/sites-available/agenda-backend /etc/nginx/conf.d/agenda-backend.conf
sudo nginx -t
sudo systemctl restart nginx
```

## 配置 SSL/HTTPS

### 使用 Let's Encrypt（推薦）

```bash
# 安裝 Certbot
sudo apt-get install -y certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install -y certbot python3-certbot-nginx      # CentOS/RHEL

# 獲取證書
sudo certbot --nginx -d your-domain.com

# 自動續期測試
sudo certbot renew --dry-run
```

### 手動配置 SSL

編輯 Nginx 配置，添加 SSL：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # SSL 優化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 監控和維護

### 設置日誌輪轉

創建 `/etc/logrotate.d/agenda-backend`：

```
/opt/agenda-backend/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0640 $USER $USER
}
```

### 數據庫備份

創建備份腳本 `/opt/agenda-backend/backend/backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/opt/agenda-backend/backend/backups"
DB_FILE="/opt/agenda-backend/backend/app.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/app.db.$DATE"

# 保留最近 7 天的備份
find $BACKUP_DIR -name "app.db.*" -mtime +7 -delete
```

設置定時任務（crontab）：

```bash
# 每天凌晨 2 點備份
0 2 * * * /opt/agenda-backend/backend/backup.sh
```

### 監控內存使用

```bash
# 查看 PM2 進程內存
pm2 monit

# 查看系統內存
free -h

# 查看 Node.js 進程內存
ps aux | grep node
```

### 性能優化建議

1. **啟用 Gzip 壓縮**（在 Nginx 配置中）：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

2. **限制並發連接**：

```nginx
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
limit_req_zone $binary_remote_addr zone=req_limit_per_ip:10m rate=10r/s;

server {
    limit_conn conn_limit_per_ip 10;
    limit_req zone=req_limit_per_ip burst=20 nodelay;
    # ...
}
```

3. **定期清理數據庫**（可選）：

```bash
# 在數據庫中執行 VACUUM（需要停止應用）
sqlite3 app.db "VACUUM;"
```

## 故障排查

### 檢查服務狀態

```bash
# PM2 狀態
pm2 status

# Nginx 狀態
sudo systemctl status nginx

# 查看日誌
pm2 logs agenda-backend
sudo tail -f /var/log/nginx/agenda-backend-error.log
```

### 常見問題

1. **端口被佔用**：
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

2. **權限問題**：
```bash
sudo chown -R $USER:$USER /opt/agenda-backend
```

3. **內存不足**：
```bash
# 檢查內存
free -h
# 重啟 PM2
pm2 restart agenda-backend
```

## 安全建議

1. **防火牆配置**：
```bash
# 只開放必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **定期更新**：
```bash
# 更新系統
sudo apt-get update && sudo apt-get upgrade  # Ubuntu/Debian
sudo yum update                              # CentOS/RHEL

# 更新 Node.js 依賴
cd /opt/agenda-backend/backend
npm update
pm2 restart agenda-backend
```

3. **保護敏感文件**：
```bash
chmod 600 .env
chmod 600 app.db
```

## 聯繫支持

如有問題，請提交 Issue 到 [GitHub Repository](https://github.com/marecop/Rem)。
