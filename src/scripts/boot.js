#!/usr/bin/env node
const { spawn } = require("child_process");
const chalk = require("chalk");

// 1. 起 concurrently
const cp = spawn(
  "concurrently",
  [
    "-k",
    "-n",
    "node,tunnel",
    "node ./src/index.js",
    "cloudflared tunnel --url http://localhost:3000",
  ],
  { stdio: ["inherit", "pipe", "inherit"] } // 只拦截 stdout
);

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
      console.log(
        "\n" +
          chalk.bgGreen.black.bold(" 🌍  Webhook URL (copy below) ") +
          "\n" +
          chalk.green.bold(m[0]) +
          "/webhook\n"
      );
    }
  }
});

// 3. 把子进程信号透传，保证 Ctrl-C 能一起退出
cp.on("exit", (code) => process.exit(code));
