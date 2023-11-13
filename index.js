import "dotenv/config";
import express from "express";

const app = express();

// 定義路由,允許get方法拜訪
app.get('/', (req, res) => {
  res.send('<h2>abc</h2>');
});

// 404 // 要放在別的路由後面 // .use是所有的方法
app.use((req, res) => {
  res.status(404).send(`<h1>你迷路了</h1>`)
})

const port = process.env.WEB_PORT || 3001; // 如果沒設定就使用3001

app.listen(3000, () => {
  console.log(`express server ${port}`)
})