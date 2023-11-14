import "dotenv/config";
import express from "express";
import sales from "./data/sales.json" assert { type: "json" };

const app = express();

// 設定樣版引擎
app.set('view engine', 'ejs');

// 定義路由,允許get方法拜訪
app.get('/', (req, res) => {
  res.render('home', { name: "yann" }); // 指定home樣版的檔案 // 傳遞name參數給樣版
});

app.get('/json-sales', (req, res) => {
  res.render('json-sales', { sales });
});

// app.get("/a.html", (req, res) => {
//   res.send(`假的 a.html`);
// });

// 設定靜態內容的資料夾 // public裡面的內容相當於在根目錄
app.use(express.static("public"));  // app.use("/",express.static("public"));
// 靜態內容的資料夾對應到 /bootstrap底下
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use("/jquery", express.static("node_modules/jquery/dist"));

// 404 // 要放在別的路由後面 // .use是所有的方法
app.use((req, res) => {
  res.status(404).send(`<h1>你迷路了</h1>`)
})

const port = process.env.WEB_PORT || 3001; // 如果沒設定就使用3001

app.listen(port, () => {
  console.log(`express server ${port}`)
})