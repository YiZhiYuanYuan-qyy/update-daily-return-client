# 📊 基金OCR识别客户端

这是一个**公开的客户端版本**，采用混合架构设计：
- **代理服务器**: 处理阿里云OCR + DeepSeek（隐藏密钥）
- **客户端服务器**: 处理Notion操作 + API密钥验证（通过环境变量配置）

### 🔐 安全特性
- **自动密钥管理**: 前端自动获取并使用API密钥，用户无需手动配置
- **访问控制**: 通过API密钥验证控制服务访问权限
- **密钥隐藏**: 敏感密钥在代理服务器中完全隐藏

## 🚀 快速部署

### 1. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel

vercel env add NOTION_TOKEN
# 输入你的Notion Token

vercel env add NOTION_DATABASE_ID  
# 输入收益记录数据库ID

vercel env add NOTION_FUND_DATABASE_ID
# 输入基金信息数据库ID
```

### 2. 本地运行

```bash
# 安装依赖
npm install

# 设置环境变量
export NOTION_TOKEN="your-notion-token"
export NOTION_DATABASE_ID="your-database-id"
export NOTION_FUND_DATABASE_ID="your-fund-database-id"

# 启动服务
npm start
```

## 🔧 配置说明

### 环境变量

#### 📋 必需配置
- `NOTION_TOKEN`: Notion API Token（必需）
- `NOTION_DATABASE_ID`: 收益记录数据库ID（必需）
- `NOTION_FUND_DATABASE_ID`: 基金信息数据库ID（必需）

#### 🔑 API密钥验证配置
- `API_KEY`: 有效的API密钥（必需）

**示例**:
```
API_KEY=sk_abc123def456ghi789jkl012mno345pqr678
```

**注意**: API密钥验证是强制启用的，必须提供有效的API密钥才能使用OCR服务。

## 🚀 使用流程

### 1. 部署客户端
```bash
vercel
```

### 2. 配置环境变量
在Vercel项目设置中添加：
- `NOTION_TOKEN`: 你的Notion Token
- `NOTION_DATABASE_ID`: 收益记录数据库ID  
- `NOTION_FUND_DATABASE_ID`: 基金信息数据库ID
- `API_KEY`: 你的API密钥

### 3. 重新部署
环境变量设置完成后，重新部署：
```bash
vercel --prod
```

### 4. 开始使用
- **网页界面**: 直接访问部署的URL，上传图片即可
- **API调用**: 使用提供的API密钥调用接口

## 🔌 API使用说明

### 🌐 网页界面使用

直接访问部署的URL，上传图片即可使用。系统会自动处理API密钥验证，无需手动配置。

### 🔧 直接API调用

如果需要直接调用API接口，需要手动提供API密钥：

```bash
curl -X POST https://your-client-url.vercel.app/api/ocr \
  -H "Content-Type: multipart/form-data" \
  -H "x-api-key: sk_your_api_key_here" \
  -F "image=@screenshot.jpg"
```

### 📋 接口说明

#### OCR识别接口
- **URL**: `POST /api/ocr`
- **请求头**: `x-api-key` (必需)
- **请求体**: `multipart/form-data` 格式的图片文件

#### 获取API密钥接口
- **URL**: `GET /api/get-key`
- **响应**: `{"apiKey": "sk_xxx", "hasKey": true}`

#### 健康检查接口
- **URL**: `GET /health`
- **响应**: 服务器状态信息

### 📤 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {
    "rawText": "OCR识别的原始文本",
    "date": "2025-01-15",
    "funds": [
      {
        "name": "基金名称",
        "amount": "1000.00"
      }
    ]
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "API密钥验证失败: API密钥不正确",
  "code": "INVALID_API_KEY"
}
```

## 📁 文件结构

```
update-daily-return-client/
├── public-client.js      # 客户端服务器
├── public-client.html    # 前端界面
├── vercel.json          # Vercel部署配置
├── package.json         # 依赖配置
└── README.md           # 说明文档
```

## 🔐 安全特性

- ✅ Notion密钥通过环境变量安全配置
- ✅ 可安全分享代码
- ✅ 混合架构提供更好的安全性
- ✅ 支持访问控制

## 🌐 API接口

### POST /api/ocr
上传图片进行OCR识别

**请求:**
- Content-Type: multipart/form-data
- Body: image文件

**响应:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-23",
    "funds": [
      {
        "name": "基金名称",
        "amount": "1000.00"
      }
    ],
    "notionResults": [...],
    "notionSummary": {...}
  }
}
```

### GET /health
健康检查接口
