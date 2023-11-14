import "dotenv/config";
import express from "express";

const app = express();

// 定義路由,允許get方法拜訪
app.get('/', (req, res) => {
  res.send('<h2>abc</h2>');
});

// app.get("/a.html", (req, res) => {
//   res.send(`假的 a.html`);
// });

// 設定靜態內容的資料夾 // public裡面的內容相當於在根目錄
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist")); // 靜態資料夾在bootstrap底下
app.use("/jquery", express.static("node_modules/jquery/dist"));

// 404 // 要放在別的路由後面 // .use是所有的方法
app.use((req, res) => {
  res.status(404).send(`<h1>你迷路了</h1>`)
})

const port = process.env.WEB_PORT || 3001; // 如果沒設定就使用3001

app.listen(port, () => {
  console.log(`express server ${port}`)
})