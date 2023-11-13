import "dotenv/config";
import express from "express";

const app = express();

// 定義路由
app.get('/', (req, res) => {
  res.send('<h2>abc</h2>');
});

const port = process.env.WEB_PORT || 3001; // 如果沒設定就是3001

app.listen(3000, () => {
  console.log(`express server ${port}`)
})