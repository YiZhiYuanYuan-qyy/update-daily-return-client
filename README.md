# 📊 基金OCR识别客户端

这是一个**公开的客户端版本**，采用混合架构设计：
- **代理服务器**: 处理阿里云OCR + DeepSeek（隐藏密钥）
- **客户端服务器**: 处理Notion操作（通过环境变量配置）

## 🚀 快速部署

### 1. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel

# 设置环境变量
vercel env add PROXY_SERVER_URL
# 输入你的代理服务器地址，例如: https://your-proxy-server.vercel.app

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
export PROXY_SERVER_URL="https://your-proxy-server.vercel.app"
export NOTION_TOKEN="your-notion-token"
export NOTION_DATABASE_ID="your-database-id"
export NOTION_FUND_DATABASE_ID="your-fund-database-id"

# 启动服务
npm start
```

## 🔧 配置说明

### 环境变量

- `PROXY_SERVER_URL`: 代理服务器地址（必需）
- `NOTION_TOKEN`: Notion API Token（必需）
- `NOTION_DATABASE_ID`: 收益记录数据库ID（必需）
- `NOTION_FUND_DATABASE_ID`: 基金信息数据库ID（必需）

### 代理服务器

你需要一个代理服务器来处理OCR和AI解析。代理服务器包含：
- 阿里云OCR API密钥
- DeepSeek API密钥

**注意**: Notion相关操作现在在客户端服务器中处理

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

- ✅ 阿里云和DeepSeek密钥通过代理服务器隐藏
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

## 🎯 使用场景

1. **个人使用**: 部署到Vercel，设置代理服务器地址和Notion环境变量
2. **团队分享**: 分享代码给团队成员，他们可以独立部署并配置自己的Notion
3. **开源项目**: 作为开源项目发布，其他人可以安全使用
4. **混合部署**: 代理服务器和客户端服务器可以分别部署到不同平台

## 📞 支持

如有问题，请检查：
1. 代理服务器是否正常运行
2. PROXY_SERVER_URL是否正确设置
3. Notion环境变量是否正确配置
4. 网络连接是否正常

---

🔐 **注意**: 
- 阿里云和DeepSeek密钥通过代理服务器隐藏
- Notion密钥通过环境变量安全配置
- 此架构提供更好的安全性和灵活性
