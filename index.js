//import "dotenv/config";
import express from "express";
import sales from "./data/sales.json" assert { type: "json" }; // import json檔目前是實驗性質的功能
//import multer from "multer";
//const upload = multer({dest:'tmp_uploads/'})
import upload from "./utils/upload-imgs.js";

import admin2Router from './routes/admin2.js';

const app = express();

// 設定樣版引擎
app.set('view engine', 'ejs');

// top-level middlewares // 依檔頭Content-Type來決定是否解析
app.use(express.urlencoded({extended:false}))
app.use(express.json());

// 自訂頂層 middleware
app.use((req,res,next)=>{
  res.locals.title="Yann 的網站"

  next()
})

// 定義路由,允許get方法拜訪
app.get('/', (req, res) => {
  res.render('home', { name: process.env.DB_NAME }); // 指定home樣版的檔案 // 傳遞name參數給樣版
});

app.get('/json-sales', (req, res) => {
  res.render('json-sales', { sales });
});

app.get('/try-qs', (req, res) => {
  res.json(req.query);
});


app.post('/try-post', (req, res) => {
  console.log("req.body:",req.body);
  res.json(req.body);
});

app.get('/try-post-form', (req, res) => {
  res.render('try-post-form')
});

app.post('/try-post-form', (req, res) => {
  res.render('try-post-form',req.body);
});

// 加入 middleware upload.single()
app.post('/try-upload', upload.single("avatar"),(req, res) => {
  res.json(req.file)
});

app.post('/try-uploads', upload.array("photos"),(req, res) => {
  res.json(req.files)
});

app.get('/my-params1/hello', (req, res) => {
  res.json({hello:"yann"})
});


// 用變數設定路由 // 寬鬆的放後面
app.get('/my-params1/:action?/:id?', (req, res) => {
  res.json(req.params)
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
  let u = req.url.slice(3).split('?')[0];
  u = u.split('-').join('');
  res.send({u});
});

app.use('/admins',admin2Router); // 當成 middleware 使用


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