# 环信回调服务器 Node.js 示例

这是一个用于演示环信(Easemob)回调服务的 Node.js 示例项目。该项目提供了分离的发送前(pre-send)和发送后(post-send)Webhook 接收服务，可以接收环信平台发送的各种回调事件。

## 功能特点

- 基于 Express 框架的轻量级 Webhook 服务器
- 分离的发送前(pre-send)和发送后(post-send)回调服务
- 自动使用 Cloudflare Tunnel 暴露本地服务到公网
- 支持处理 JSON、原始数据和 URL 编码的请求体
- 完整的请求日志记录（包括请求头和请求体）
- 终端输出的 JSON 数据高亮显示，提高可读性
- 可配置的消息内容检查和处理逻辑
- 支持 ext 字段扩展处理
- 丰富的启动脚本，满足不同使用场景

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

启动项目后，控制台会显示完整的可复制 Webhook URL，例如：

```
发送前回调 Webhook 服务运行在 http://localhost:3000
监听路径: POST /webhook/pre-send
完整可复制URL: http://localhost:3000/webhook/pre-send
```

或者使用隧道模式时：

```
发送前回调 Webhook 服务运行在 http://localhost:3000
监听路径: POST /webhook/pre-send
完整可复制URL: http://localhost:3000/webhook/pre-send
🌍  Webhook URL (copy below)
https://xxxxxx.trycloudflare.com/webhook/pre-send
```

复制对应的 URL 并在环信管理后台配置为回调地址。

### 健康检查

项目提供了健康检查端点：

- 发送前回调服务：`http://localhost:3000/`
- 发送后回调服务：`http://localhost:3001/`

访问这些地址会返回服务状态信息，表示服务正常运行。

### 接收回调

- 发送前回调：`/webhook/pre-send`（端口：3000）
  - 在消息发送前验证内容，只有返回 `valid: true` 才能让消息下行
  - 支持根据配置阻止消息发送
  - 可扩展消息内容的 ext 字段

- 发送后回调：`/webhook/post-send`（端口：3001）
  - 在消息发送完成后接收通知，用于记录或后续处理
  - 记录消息日志、触发后续流程等

## 日志格式

当收到回调请求时，服务会在控制台输出高亮显示的日志，不同类型的数据使用不同颜色：

```
[2025-12-05T11:03:13.692Z] POST /webhook/pre-send
Headers:
{
  "host": "localhost:3000",
  "user-agent": "curl/8.7.1",
  "accept": "*/*",
  "content-type": "application/json",
  "content-length": 315
}
Body:
{
  "callId": "easemob-demo#test2",
  "timestamp": 1764932255289,
  "chat_type": "groupchat",
  "from": "test_user",
  "to": "test_group",
  "msg_id": "1234567891",
  "payload": {
    "bodies": [
      {
        "msg": "这是一条测试消息，包含内容检查逻辑",
        "type": "txt"
      }
    ],
    "ext": true,
    "from": "test_user",
    "meta": {},
    "to": "test_group",
    "type": "groupchat"
  }
}
```

- 键名：青色
- 字符串值：绿色
- 数字值：黄色
- 布尔值：紫色
- null值：红色

## 配置说明

### 端口配置

- 发送前回调服务：3000（在 `src/pre_send_webhook.js` 中修改）
- 发送后回调服务：3001（在 `src/post_send_webhook.js` 中修改）

### 发送前回调配置

在 `src/pre_send_webhook.js` 文件中，可以配置以下常量：

```javascript
// 配置常量 - 状态开关
const ALLOW_MESSAGE_SEND = true; // 设置为 false 时，所有消息都会被阻止
const INSERT_TEST_EXT = true; // 设置为 true 时，如果 payload.ext 为 true，会插入 test 字段
```

### 自定义处理逻辑

- **发送前回调**：在 `src/pre_send_webhook.js` 的 `/webhook/pre-send` 路由中修改
  - 实现消息内容检查逻辑
  - 控制消息是否允许发送
  - 扩展消息内容

- **发送后回调**：在 `src/post_send_webhook.js` 的 `/webhook/post-send` 路由中修改
  - 实现消息发送后的处理逻辑
  - 记录消息日志
  - 触发后续流程

## 启动脚本说明

项目提供了丰富的启动脚本，满足不同使用场景：

| 命令 | 描述 |
|------|------|
| `pnpm run pre-send` | 启动发送前回调服务（端口：3000） |
| `pnpm run post-send` | 启动发送后回调服务（端口：3001） |
| `pnpm run both` | 同时启动发送前和发送后回调服务 |
| `pnpm run pre-send-tunnel` | 启动发送前回调服务并创建公网隧道 |
| `pnpm run post-send-tunnel` | 启动发送后回调服务并创建公网隧道 |
| `pnpm run start` | 启动默认回调服务（兼容旧版本，端口：3000） |
| `pnpm run tunnel` | 启动默认服务并创建公网隧道 |
| `pnpm run no-tunnel` | 启动默认服务但不创建公网隧道 |

## 注意事项

1. 请确保安装了 `cloudflared` 工具，否则使用隧道模式会失败
2. 回调 URL 使用的是临时域名，重启服务后可能会改变
3. 生产环境中建议使用固定域名和 HTTPS
4. 请根据环信文档验证回调签名，确保请求来自环信服务器
5. 发送前和发送后回调服务使用不同端口（3000和3001），避免冲突
6. 终端日志的颜色显示需要终端支持 ANSI 颜色代码

## 开发指南

### 开发调试

- 单独启动发送前回调服务：`node ./src/pre_send_webhook.js`
- 单独启动发送后回调服务：`node ./src/post_send_webhook.js`
- 使用隧道模式开发：`node ./src/scripts/boot.js pre-send --tunnel`

### 自定义日志显示

在 `pre_send_webhook.js` 和 `post_send_webhook.js` 文件中，可以修改 `highlightJson` 函数来自定义 JSON 高亮显示效果。

## License

ISC License