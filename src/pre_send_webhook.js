const express = require("express");
const bodyParser = require("body-parser");
const chalk = require("chalk");
const app = express();
const port = 3000;

// 配置常量 - 状态开关
const ALLOW_MESSAGE_SEND = true; // 设置为 false 时，所有消息都会被阻止
const INSERT_TEST_EXT = true; // 设置为 true 时，如果 payload.ext 为 true，会插入 test 字段

// 支持 json / raw / urlencoded
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.raw({ type: "application/octet-stream" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查
app.get("/", (_req, res) => res.send("pre-send webhook service is running"));

/**
 * JSON 高亮显示函数
 * @param {object} jsonData - 要高亮显示的 JSON 数据
 * @returns {string} - 带有 ANSI 颜色代码的高亮 JSON 字符串
 */
function highlightJson(jsonData) {
  if (typeof jsonData !== "string") {
    jsonData = JSON.stringify(jsonData, null, 2);
  }
  
  return jsonData.replace(
    /("(\w+)")\s*:\s*("[^"]*"|\d+|true|false|null|\{[^}]*\}|\[[^\]]*\])/g,
    (match, key, keyName, value) => {
      // 高亮键名
      const highlightedKey = chalk.cyan(key);
      
      // 根据值的类型高亮
      let highlightedValue = value;
      if (value.startsWith("\"")) {
        // 字符串 - 绿色
        highlightedValue = chalk.green(value);
      } else if (!isNaN(value)) {
        // 数字 - 黄色
        highlightedValue = chalk.yellow(value);
      } else if (value === "true" || value === "false") {
        // 布尔值 - 紫色
        highlightedValue = chalk.magenta(value);
      } else if (value === "null") {
        // null - 红色
        highlightedValue = chalk.red(value);
      }
      
      return `${highlightedKey}: ${highlightedValue}`;
    }
  );
}

/**
 * 发送前回调 webhook 路由
 * 功能：在消息发送前验证内容，只有返回 OK 才能让消息下行
 */
app.post("/webhook/pre-send", (req, res) => {
  console.log(chalk.bgBlueBright.black(`[${new Date().toISOString()}] ${req.method} ${req.path}`));
  console.log(chalk.bold.underline("Headers:"));
  console.log(highlightJson(req.headers));
  console.log(chalk.bold.underline("Body:"));
  console.log(highlightJson(req.body));

  // 初始化响应对象
  const response = {
    valid: ALLOW_MESSAGE_SEND,
    code: "HX:10000",
    payload: {}
  };

  // 如果全局开关关闭，直接返回阻止
  if (!ALLOW_MESSAGE_SEND) {
    res.status(200).json(response);
    return;
  }

  // 这里可以添加内容检查逻辑
  // 示例：检查消息内容是否包含敏感词
  // 从payload.bodies中获取消息内容
  const messageContent = req.body?.payload?.bodies?.[0]?.msg;
  const isContentValid = checkContentValidity(messageContent);

  // 根据内容检查结果更新valid状态
  response.valid = isContentValid;

  // 处理消息内容
  if (isContentValid && messageContent) {
    // 仅支持文本类型消息
    response.payload = {
      msg_type: "txt",
      msg_content: messageContent
    };

    // 检查是否需要处理ext字段
    if (INSERT_TEST_EXT && req.body?.payload?.ext) {
      // 插入test字段
      response.payload.test = "尝试插入一个ext";
    }
  }

  // 返回响应
  res.status(200).json(response);
});

/**
 * 内容检查函数
 * @param {string} content - 消息内容
 * @returns {boolean} - 是否允许发送
 */
function checkContentValidity(content) {
  if (!content) return true;
  
  // 示例：简单的敏感词检查
  const sensitiveWords = ["敏感词1", "敏感词2", "测试敏感词"];
  const lowerContent = content.toLowerCase();
  
  return !sensitiveWords.some(word => lowerContent.includes(word.toLowerCase()));
}

// 启动服务器
app.listen(port, () => {
  const baseUrl = `http://localhost:${port}`;
  const webhookPath = "/webhook/pre-send";
  const fullUrl = `${baseUrl}${webhookPath}`;
  
  console.log(`发送前回调 Webhook 服务运行在 ${baseUrl}`);
  console.log(`监听路径: POST ${webhookPath}`);
  console.log(`完整可复制URL: ${fullUrl}`);
}).on('error', (err) => {
  console.error('服务器启动错误:', err);
  process.exit(1);
});

// 保持进程运行
process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  process.exit(0);
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});