import express from "express";

const app = express();

// 定義路由
app.get('/', (req, res) => {
  res.send('<h2>abc</h2>');
});

app.listen(3000, () => {
  console.log(`express server 啟動`)
})