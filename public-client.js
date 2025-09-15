const express = require('express');
const path = require('path');
const multer = require('multer');
const https = require('https');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// multer 配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'), false);
    }
  }
});

// 🌐 代理服务器地址 - 处理OCR和DeepSeek
const PROXY_SERVER_URL = 'https://update-daily-return-proxy-h11zoihhp-yizhiyuanyuans-projects.vercel.app';

// 🔓 Vercel认证绕过密钥 - 客户端服务器的bypass secret
const VERCEL_BYPASS_SECRET = 'gzAlcWhz4m95PQwZfSGYH35bSe7pPHvN';

// 🔓 代理服务器的bypass secret
const PROXY_BYPASS_SECRET = 'yZya01XGcGVYy3rm6kmDAz4Rc9rOXul4';

// 🔑 API密钥配置 - 从环境变量获取客户的API密钥
const API_KEY_CONFIG = {
  // 客户的API密钥，从环境变量获取
  key: process.env.API_KEY || ''
};

// 🔐 Notion配置 - 在客户端服务器中处理
const NOTION_CONFIG = {
  token: process.env.NOTION_TOKEN || '',
  databaseId: process.env.NOTION_DATABASE_ID || '',
  fundDatabaseId: process.env.NOTION_FUND_DATABASE_ID || ''
};

// 初始化 Notion 客户端
const notion = new Client({
  auth: NOTION_CONFIG.token,
  notionVersion: '2025-09-03'   // 使用最新API版本
});

// 🔑 检查API密钥是否已配置
function checkApiKeyConfigured() {
  if (!API_KEY_CONFIG.key) {
    return { configured: false, reason: '未配置API密钥，请在环境变量中设置API_KEY' };
  }
  return { configured: true, reason: 'API密钥已配置' };
}

console.log('🌐 客户端服务器启动');
console.log('🔗 代理服务器地址:', PROXY_SERVER_URL);
console.log('📋 Notion配置:', NOTION_CONFIG.token ? '已设置' : '未设置');
console.log('📋 数据库ID:', NOTION_CONFIG.databaseId);
console.log('🔑 客户API密钥:', API_KEY_CONFIG.key ? '已设置' : '未设置');
console.log('🔍 API密钥值:', API_KEY_CONFIG.key ? API_KEY_CONFIG.key.substring(0, 10) + '...' : 'undefined');

// 调用代理服务器的OCR接口
async function callProxyOCR(imageBuffer) {
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('image', imageBuffer, {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });

    const url = new URL('/api/ocr', PROXY_SERVER_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'x-api-key': API_KEY_CONFIG.key,  // 传递客户的API密钥给代理服务器
        'x-vercel-protection-bypass': PROXY_BYPASS_SECRET,  // 代理服务器的bypass secret
        'x-vercel-set-bypass-cookie': 'true',  // 设置bypass cookie
        ...form.getHeaders()  // FormData头部放在最后，避免覆盖自定义头部
      },
      timeout: 60000 // 60秒超时
    };
    
    // 调试：打印请求头
    console.log('🔍 发送请求头:', options.headers);

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // 处理重定向
        if (res.statusCode === 307 && res.headers.location) {
          console.log('🔄 检测到重定向，重新请求:', res.headers.location);
          
          // 重新创建FormData，因为原来的已经被消耗了
          const FormData = require('form-data');
          const newForm = new FormData();
          newForm.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
          });
          
          // 重新请求重定向的URL
          const redirectUrl = new URL(res.headers.location, PROXY_SERVER_URL);
          
          // 提取cookie
          const cookies = res.headers['set-cookie'] || [];
          const cookieHeader = cookies.map(cookie => cookie.split(';')[0]).join('; ');
          
          const redirectOptions = {
            hostname: redirectUrl.hostname,
            port: redirectUrl.port || (redirectUrl.protocol === 'https:' ? 443 : 80),
            path: redirectUrl.pathname,
            method: 'POST',
            headers: {
              'x-api-key': API_KEY_CONFIG.key,
              'x-vercel-protection-bypass': PROXY_BYPASS_SECRET,
              'x-vercel-set-bypass-cookie': 'true',
              'cookie': cookieHeader,  // 携带cookie
              ...newForm.getHeaders()  // FormData头部放在最后，避免覆盖自定义头部
            },
            timeout: 120000 // 增加超时时间到2分钟
          };
          
          console.log('🍪 携带cookie:', cookieHeader);
          
          console.log('🔄 发送重定向请求...');
          const redirectReq = https.request(redirectOptions, (redirectRes) => {
            let redirectData = '';
            
            redirectRes.on('data', (chunk) => {
              redirectData += chunk;
            });
            
            redirectRes.on('end', () => {
              console.log('✅ 重定向请求完成');
              try {
                const result = JSON.parse(redirectData);
                if (redirectRes.statusCode === 200) {
                  resolve(result);
                } else {
                  reject(new Error(`代理服务器错误: ${redirectRes.statusCode} - ${result.error || redirectData}`));
                }
              } catch (e) {
                console.log('🔍 重定向后响应调试信息:');
                console.log('📊 状态码:', redirectRes.statusCode);
                console.log('📋 响应头:', redirectRes.headers);
                console.log('📄 完整响应数据:', redirectData);
                reject(new Error(`重定向后响应格式错误: ${e.message}，响应内容: ${redirectData}`));
              }
            });
          });
          
          redirectReq.on('error', (error) => {
            console.log('❌ 重定向请求错误:', error.message);
            reject(new Error('重定向请求失败: ' + error.message));
          });
          
          redirectReq.on('timeout', () => {
            console.log('⏰ 重定向请求超时');
            redirectReq.destroy();
            reject(new Error('重定向请求超时'));
          });
          
          newForm.pipe(redirectReq);
          return;
        }
        
        try {
          const result = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            reject(new Error(`代理服务器错误: ${res.statusCode} - ${result.error || responseData}`));
          }
        } catch (e) {
          // 打印详细的调试信息
          console.log('🔍 代理服务器响应调试信息:');
          console.log('📊 状态码:', res.statusCode);
          console.log('📋 响应头:', res.headers);
          console.log('📄 完整响应数据:', responseData);
          console.log('❌ JSON解析错误:', e.message);
          
          // 如果不是JSON，直接返回错误信息
          if (responseData.includes('<!doctype') || responseData.includes('<html')) {
            reject(new Error(`代理服务器返回HTML页面 (状态码: ${res.statusCode})，可能是认证问题或服务器错误。响应内容: ${responseData}`));
          } else if (responseData.includes('Redirecting')) {
            reject(new Error(`代理服务器返回重定向响应 (状态码: ${res.statusCode})，响应内容: ${responseData}`));
          } else {
            reject(new Error(`代理服务器响应格式错误: ${e.message}，响应内容: ${responseData}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error('代理服务器连接失败: ' + error.message));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('代理服务器请求超时'));
    });

    // 发送表单数据
    form.pipe(req);
  });
}

// 获取Notion基金列表
async function getNotionFunds() {
  try {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_CONFIG.fundDatabaseId
    });
    
    const funds = [];
    for (const page of response.results) {
      const properties = page.properties;
      const fundName = properties['基金名称']?.title?.[0]?.plain_text || '未知基金';
      funds.push({ id: page.id, name: fundName, notionId: page.id });
    }
    
    console.log(`从Notion获取到 ${funds.length} 个基金`);
    return funds;
  } catch (error) {
    console.error('获取Notion基金列表失败:', error.message);
    throw error;
  }
}

// 匹配基金名称
function matchFundName(ocrFundName, notionFunds) {
  const normalizedOcrName = ocrFundName.toLowerCase().trim();
  
  for (const notionFund of notionFunds) {
    const normalizedNotionName = notionFund.name.toLowerCase().trim();
    
    if (normalizedOcrName === normalizedNotionName) {
      return notionFund;
    }
    
    if (normalizedOcrName.includes(normalizedNotionName) || 
        normalizedNotionName.includes(normalizedOcrName)) {
      return notionFund;
    }
  }
  
  return null;
}

// 格式化日期
function formatDateForNotion(dateStr) {
  if (!dateStr) return null;
  
  const dateFormats = [
    /(\d{4})[-年](\d{1,2})[-月](\d{1,2})[日]?/,
    /(\d{1,2})[-月](\d{1,2})[日]?/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/
  ];
  
  for (const format of dateFormats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day;
      
      if (match.length === 4) {
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else if (match.length === 3) {
        year = new Date().getFullYear();
        month = parseInt(match[1]);
        day = parseInt(match[2]);
      }
      
      if (year && month && day) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return null;
}

// 创建页面标题
function createPageTitle(dateStr) {
  if (!dateStr) return `@${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return `@${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  
  return `@${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

// 添加基金数据到Notion
async function addFundDataToNotion(fundData, notionFunds) {
  const results = [];
  const summary = {
    total: fundData.funds.length,
    success: 0,
    failed: 0,
    unmatched: 0,
    skipped: 0,
    errors: []
  };
  
  console.log(`🔄 开始处理 ${fundData.funds.length} 个基金数据...`);
  
  for (const fund of fundData.funds) {
    try {
      const matchedFund = matchFundName(fund.name, notionFunds);
      if (!matchedFund) {
        results.push({
          success: false,
          fundName: fund.name,
          amount: fund.amount,
          error: '未找到匹配的基金',
          type: 'unmatched'
        });
        summary.unmatched++;
        summary.errors.push(`基金 "${fund.name}" 未找到匹配项`);
        continue;
      }

      const amount = parseFloat(fund.amount);
      if (amount === 0) {
        results.push({
          success: true,
          fundName: fund.name,
          matchedFundName: matchedFund.name,
          amount: fund.amount,
          type: 'skipped',
          reason: '金额为0，跳过记录'
        });
        summary.skipped++;
        continue;
      }
      
      const formattedDate = formatDateForNotion(fundData.date);
      const pageTitle = createPageTitle(formattedDate);
      
      const response = await notion.pages.create({
        parent: { database_id: NOTION_CONFIG.databaseId },
        properties: {
          '操作日期': {
            title: [{ text: { content: pageTitle } }]
          },
          '基金信息': {
            relation: [{ id: matchedFund.notionId }]
          },
          '变动金额(+/-)': {
            number: parseFloat(fund.amount)
          },
          '仓位变化类型': {
            select: { name: '收益' }
          },
          '日期': {
            date: {
              start: formattedDate || new Date().toISOString().split('T')[0]
            }
          }
        }
      });
      
      results.push({
        success: true,
        fundName: fund.name,
        matchedFundName: matchedFund.name,
        notionPageId: response.id,
        amount: fund.amount,
        type: 'success'
      });
      
      summary.success++;
      
    } catch (error) {
      results.push({
        success: false,
        fundName: fund.name,
        amount: fund.amount,
        error: error.message,
        type: 'error'
      });
      summary.failed++;
      summary.errors.push(`基金 "${fund.name}" 写入失败: ${error.message}`);
    }
  }
  
  console.log(`\n📊 处理结果摘要:`);
  console.log(`   总计: ${summary.total} 个基金`);
  console.log(`   ✅ 成功: ${summary.success} 个`);
  console.log(`   ❌ 失败: ${summary.failed} 个`);
  console.log(`   🔍 未匹配: ${summary.unmatched} 个`);
  console.log(`   ⏭️  跳过: ${summary.skipped} 个`);
  
  return { results, summary };
}

// 🌐 公开的OCR接口 - 其他人可以调用这个接口
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    // 🔑 检查API密钥是否已配置
    const keyCheck = checkApiKeyConfigured();
    
    if (!keyCheck.configured) {
      console.log('❌ API密钥未配置:', keyCheck.reason);
      return res.status(400).json({
        success: false,
        error: `配置错误: ${keyCheck.reason}`,
        code: 'API_KEY_NOT_CONFIGURED'
      });
    }
    
    console.log('✅ API密钥已配置，转发到代理服务器验证');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: '请上传图片文件' 
      });
    }

    console.log('📸 收到OCR请求，转发到代理服务器...');
    
    // 调用代理服务器 (OCR + DeepSeek)
    const proxyResult = await callProxyOCR(req.file.buffer);
    
    if (!proxyResult.success) {
      throw new Error(proxyResult.error);
    }
    
    console.log('✅ 代理服务器处理完成');
    
    // 获取Notion基金列表
    const notionFunds = await getNotionFunds();
    
    // 添加数据到Notion
    const notionResults = await addFundDataToNotion(proxyResult.data, notionFunds);
    
    res.json({
      success: true,
      data: {
        rawText: proxyResult.data.rawText,
        date: proxyResult.data.date,
        funds: proxyResult.data.funds,
        notionResults: notionResults.results,
        notionSummary: notionResults.summary
      }
    });
    
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: `处理失败: ${error.message}` 
    });
  }
});

// 获取API密钥状态接口（供前端使用）
app.get('/api/get-key', (req, res) => {
  const keyCheck = checkApiKeyConfigured();
  res.json({ 
    configured: keyCheck.configured,
    reason: keyCheck.reason
  });
});

// 健康检查接口
app.get('/health', (req, res) => {
  const keyCheck = checkApiKeyConfigured();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: '客户端服务器运行正常',
    proxyServer: PROXY_SERVER_URL,
    apiKey: {
      configured: keyCheck.configured,
      reason: keyCheck.reason
    },
    notion: {
      token: NOTION_CONFIG.token ? '已设置' : '未设置',
      databaseId: NOTION_CONFIG.databaseId || '未设置',
      fundDatabaseId: NOTION_CONFIG.fundDatabaseId
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 客户端服务器运行在 http://localhost:${PORT}`);
  console.log(`🌐 公开API地址: http://localhost:${PORT}/api/ocr`);
  console.log(`❤️  健康检查: http://localhost:${PORT}/health`);
  console.log(`\n📋 使用说明:`);
  console.log(`   1. 设置Notion环境变量:`);
  console.log(`      - NOTION_TOKEN: 你的Notion Token`);
  console.log(`      - NOTION_DATABASE_ID: 收益记录数据库ID`);
  console.log(`      - NOTION_FUND_DATABASE_ID: 基金信息数据库ID`);
  console.log(`   2. 其他人可以复制这个代码，但看不到你的API密钥`);
  console.log(`\n🔐 架构说明:`);
  console.log(`   - 代理服务器: 处理阿里云OCR + DeepSeek`);
  console.log(`   - 客户端服务器: 处理Notion操作`);
});

module.exports = app;

