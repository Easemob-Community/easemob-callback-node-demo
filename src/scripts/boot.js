#!/usr/bin/env node
const { spawn, spawnSync } = require("child_process");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

// 检查命令行参数
const args = process.argv.slice(2);
const forceTunnel = args.includes("--tunnel") || args.includes("-t");
const skipTunnel = args.includes("--no-tunnel") || args.includes("-nt");
const serviceType = args[0] || "index";

// 配置不同服务的参数
const services = {
  index: {
    script: "./src/index.js",
    port: 3000,
    webhookPath: "/webhook"
  },
  "pre-send": {
    script: "./src/pre_send_webhook.js",
    port: 3000,
    webhookPath: "/webhook/pre-send"
  },
  "post-send": {
    script: "./src/post_send_webhook.js",
    port: 3001,
    webhookPath: "/webhook/post-send"
  }
};

// 获取当前服务配置
const currentService = services[serviceType] || services.index;

// 检查 cloudflared 是否可用
function isCloudflaredAvailable() {
  try {
    // 1. 直接运行 cloudflared --version
    const result = spawnSync("cloudflared", ["--version"], { stdio: "ignore" });
    
    if (result.error) {
      // 2. 如果失败，尝试使用 which 命令
      const whichResult = spawnSync("which", ["cloudflared"], { encoding: "utf8" });
      if (whichResult.stdout.trim()) {
        // 如果 which 找到了路径，尝试使用该路径运行
        const cloudflaredPath = whichResult.stdout.trim();
        const pathResult = spawnSync(cloudflaredPath, ["--version"], { stdio: "ignore" });
        return !pathResult.error;
      }
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

const cloudflaredAvailable = isCloudflaredAvailable();

// 1. 起 concurrently 或单独运行 node
let cp;
let useTunnel = cloudflaredAvailable;

// 处理命令行参数
if (forceTunnel) {
  useTunnel = true;
  console.log(chalk.yellow("⚠️  强制启用 Cloudflare Tunnel (--tunnel)\n"));
} else if (skipTunnel) {
  useTunnel = false;
  console.log(chalk.yellow("⚠️  跳过 Cloudflare Tunnel (--no-tunnel)\n"));
}

if (useTunnel) {
  // 如果需要使用 cloudflared，同时运行 node 和 cloudflared
  cp = spawn(
    "concurrently",
    [
      "-k",
      "-n",
      "node,tunnel",
      `node ${currentService.script}`,
      `cloudflared tunnel --url http://localhost:${currentService.port}`,
    ],
    { stdio: ["inherit", "pipe", "inherit"] } // 只拦截 stdout
  );
} else {
  // 如果 cloudflared 不可用或被跳过，只运行 node
  if (!cloudflaredAvailable && !skipTunnel) {
    console.log(chalk.yellow("⚠️  cloudflared 未安装，将只启动本地服务器\n"));
  }
  cp = spawn(
    "node",
    [currentService.script],
    { stdio: ["inherit", "pipe", "inherit"] }
  );
}

// 2. 实时过滤 cloudflared 输出，抓到域名就高亮打印
const REG = /https:\/\/[a-z0-9\-]+\.trycloudflare\.com/g;
let shown = false;

cp.stdout.on("data", (buf) => {
  const line = buf.toString();
  // 依旧把原始日志吐出去，保持并发日志格式
  process.stdout.write(line);

  // 一旦匹配到域名且还没提示过，就高亮输出
  if (!shown) {
    const m = line.match(REG);
    if (m) {
      shown = true;
      const fullWebhookUrl = m[0] + currentService.webhookPath;
      console.log(
        "\n" +
          chalk.bgGreen.black.bold(" 🌍  Webhook URL (copy below) ") +
          "\n" +
          chalk.green.bold(fullWebhookUrl) +
          "\n"
      );
    }
  }
});

// 3. 把子进程信号透传，保证 Ctrl-C 能一起退出
cp.on("exit", (code) => process.exit(code));
