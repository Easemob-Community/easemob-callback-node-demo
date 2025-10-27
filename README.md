# 环信回调服务器 Node.js 示例

这是一个用于演示环信(Easemob)回调服务的 Node.js 示例项目。该项目提供了一个简单的 Webhook 接收服务，可以接收环信平台发送的各种回调事件。

## 功能特点

- 基于 Express 框架的轻量级 Webhook 服务器
- 自动使用 Cloudflare Tunnel 暴露本地服务到公网
- 支持处理 JSON、原始数据和 URL 编码的请求体
- 完整的请求日志记录（包括请求头和请求体）
- 简单易用的启动脚本

## 技术栈

- Node.js
- Express
- Cloudflare Tunnel (通过 cloudflared 工具)
- concurrently (同时运行多个进程)

## 快速开始

### 前提条件

- Node.js 14+ 环境
- 已安装 `cloudflared` 工具（用于创建公网隧道）

### 安装步骤

1. 克隆或下载本项目到本地

```bash
git clone <项目地址>
cd easemob-callback-node-demo
```

2. 安装依赖

```bash
npm install
```

### 运行项目

```bash
npm start
```

运行后，系统会自动：
1. 启动本地 Express 服务器（默认端口：3000）
2. 创建 Cloudflare Tunnel 将本地服务暴露到公网
3. 自动识别并高亮显示公网访问地址

## 使用说明

### 获取 Webhook URL

启动项目后，控制台会显示类似以下内容：

```
🌍  Webhook URL (copy below) 
https://xxxxxx.trycloudflare.com/webhook
```

复制此 URL 并在环信管理后台配置为回调地址。

### 健康检查

项目提供了健康检查端点：

```
http://localhost:3000/
```

访问此地址会返回 `ok`，表示服务正常运行。

### 接收回调

所有环信发送的回调事件都会发送到以下端点：

```
/webhook
```

服务会自动记录请求的详细信息，并返回 200 状态码表示成功接收。

## 日志格式

当收到回调请求时，服务会在控制台输出以下格式的日志：

```
[2023-06-01T12:00:00.000Z] POST /webhook
Headers: {
  "content-type": "application/json",
  "x-easemob-signature": "xxxxxx",
  ...
}
Body: {
  "event": "message.delivered",
  "data": {
    ...
  }
}
```

## 配置说明

### 修改端口

如需修改服务端口，可以在 `src/index.js` 文件中修改：

```javascript
const port = 3000; // 修改为所需端口
```

### 自定义处理逻辑

在 `src/index.js` 文件中，可以自定义 `/webhook` 路由的处理逻辑：

```javascript
app.post("/webhook", (req, res) => {
  // 在这里添加自定义处理逻辑
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body   :", JSON.stringify(req.body, null, 2));
  
  // 返回 200 让 IM 知道成功
  res.status(200).json({ echo: "received" });
});
```

## 注意事项

1. 请确保安装了 `cloudflared` 工具，否则无法创建公网隧道
2. 回调 URL 使用的是临时域名，重启服务后可能会改变
3. 生产环境中建议使用固定域名和 HTTPS
4. 请根据环信文档验证回调签名，确保请求来自环信服务器

## 开发指南

如果需要开发或调试，可以直接运行：

```bash
node ./src/index.js
```

这将只启动本地服务器，不创建公网隧道。

## License

ISC License