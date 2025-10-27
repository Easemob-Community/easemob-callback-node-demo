const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

// 支持 json / raw / urlencoded
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.raw({ type: "application/octet-stream" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 健康检查
app.get("/", (_req, res) => res.send("ok"));

// 真正的 webhook 路由
app.post("/webhook", (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body   :", JSON.stringify(req.body, null, 2));
  // 返回 200 让 IM 知道成功
  res.status(200).json({ echo: "received" });
});

app.listen(port, () => console.log(`Local server on http://localhost:${port}`));
