const express = require("express");
const bodyParser = require("body-parser");
const chalk = require("chalk");
const app = express();
const port = 3001; // 使用不同端口避免冲突

// 支持 json / raw / urlencoded
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.raw({ type: "application/octet-stream" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查
app.get("/", (_req, res) => res.send("post-send webhook service is running"));

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
 * 发送后回调 webhook 路由
 * 功能：在消息发送完成后接收通知，用于记录或后续处理
 */
app.post("/webhook/post-send", (req, res) => {
  console.log(chalk.bgBlueBright.black(`[${new Date().toISOString()}] ${req.method} ${req.path}`));
  console.log(chalk.bold.underline("Headers:"));
  console.log(highlightJson(req.headers));
  console.log(chalk.bold.underline("Body:"));
  console.log(highlightJson(req.body));

  // 这里可以添加消息发送后的处理逻辑
  // 示例：记录消息日志、触发后续流程等
  handlePostSendNotification(req.body);

  // 发送后回调通常不需要复杂的返回值，只需确认收到即可
  res.status(200).json({ code: 0, message: "Received", data: { processed: true } });
});

/**
 * 处理发送后通知
 * @param {object} notificationData - 通知数据
 */
function handlePostSendNotification(notificationData) {
  // 示例：记录消息日志
  console.log(`[LOG] 消息已发送: 消息ID=${notificationData?.msg_id}, 发送方=${notificationData?.from}, 接收方=${notificationData?.to}`);
  
  // 可以在这里添加更多业务逻辑
  // 例如：更新统计数据、触发其他系统事件等
}

// 启动服务器
app.listen(port, () => {
  const baseUrl = `http://localhost:${port}`;
  const webhookPath = "/webhook/post-send";
  const fullUrl = `${baseUrl}${webhookPath}`;
  
  console.log(`发送后回调 Webhook 服务运行在 ${baseUrl}`);
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