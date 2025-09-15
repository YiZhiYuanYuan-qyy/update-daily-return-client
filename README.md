# 📊 基金OCR识别客户端

这是一个**公开的客户端版本**，用于基金收益截图识别和Notion数据同步。

## 🏗️ 系统架构

```
用户上传图片 → 客户端服务器 → 代理服务器 → 阿里云OCR + DeepSeek
                ↓
            Notion数据库 ← 客户端服务器
```

- **客户端服务器**: 处理Notion操作 + API密钥验证
- **代理服务器**: 处理阿里云OCR + DeepSeek

## 🚀 快速部署

### 1. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 2. 配置环境变量

在Vercel项目设置中添加以下环境变量：

#### 📋 必需配置
- `NOTION_TOKEN`: Notion API Token
- `NOTION_DATABASE_ID`: 收益记录数据库ID  
- `NOTION_FUND_DATABASE_ID`: 基金信息数据库ID
- `API_KEY`: 有效的API密钥（从管理员获取）

#### 🔧 配置示例
```
NOTION_TOKEN=secret_xxx
NOTION_DATABASE_ID=266d37fa4cf881b18b42f1e0f4839142
NOTION_FUND_DATABASE_ID=266d37fa4cf8818189e9000b9a6a25aa
API_KEY=sk_abc123def456ghi789jkl012mno345pqr678
```

### 3. 重新部署

环境变量设置完成后，重新部署：
```bash
vercel --prod
```

## 📖 使用说明

### 🌐 网页界面使用

1. 访问部署的URL
2. 上传基金收益截图
3. 点击"开始识别"
4. 系统自动处理并同步到Notion


**注意**: API密钥验证是自动的，客户端会自动传递环境变量中的API密钥。


## 📁 文件结构

```
update-daily-return-client/
├── public-client.js      # 客户端服务器
├── public-client.html    # 前端界面
├── vercel.json          # Vercel部署配置
├── package.json         # 依赖配置
└── README.md           # 说明文档
```

## ❓ 常见问题

### Q: 如何获取API密钥？
A: 联系管理员获取有效的API密钥，然后在Vercel环境变量中配置。

### Q: API密钥验证失败怎么办？
A: 检查环境变量中的API_KEY是否正确配置，确保密钥有效且未过期。

### Q: Notion同步失败怎么办？
A: 检查Notion相关的环境变量是否正确配置，确保数据库ID和Token有效。

## 📞 技术支持

如有问题，请联系管理员获取技术支持。