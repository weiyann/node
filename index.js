//import "dotenv/config";
import express from "express";
import session from "express-session";
import dayjs from "dayjs";
import moment from "moment-timezone";
import sales from "./data/sales.json" assert { type: "json" }; // import json檔目前是實驗性質的功能
//import multer from "multer";
//const upload = multer({dest:'tmp_uploads/'})
import upload from "./utils/upload-imgs.js";
import db from './utils/connect-mysql.js';


import admin2Router from './routes/admin2.js';
import addressBookRouter from './routes/address-book.js';

const app = express();

// 設定樣版引擎
app.set('view engine', 'ejs');

// top-level middlewares // 依檔頭Content-Type來決定是否解析
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(
  session({
    saveUninitialized: false, // 新用戶沒有使用到 session 物件時不會建立 session 和發送 cookie
    resave: false,  // 沒變更內容是否強制回存
    secret: 'feagfegwevgv213',
    // cookie: {
    // maxAge: 1200_000, // 20分鐘，單位毫秒
    // },
  }))

// 自訂頂層 middleware // 放後面
app.use((req, res, next) => {
  res.locals.title = "Yann 的網站"; // 將title設定為樣版屬性

  next() //req,res 往下傳遞
})

// 定義路由,允許get方法拜訪
app.get('/', (req, res) => {
  res.locals.title = '首頁｜' + res.locals.title
  res.render('home', { name: process.env.DB_NAME }); // 指定home樣版的檔案 // 傳遞name參數給樣版
});

app.get('/json-sales', (req, res) => {
  res.locals.title = "JSON資料 | " + res.locals.title;
  res.render('json-sales', { sales });
});

app.get('/try-qs', (req, res) => {
  res.json(req.query);
});


app.post('/try-post', (req, res) => {
  console.log("req.body:", req.body);
  res.json(req.body);
});

app.get('/try-post-form', (req, res) => {
  res.render('try-post-form')
});

app.post('/try-post-form', (req, res) => {
  res.render('try-post-form', req.body);
});

// 加入 middleware upload.single()
app.post('/try-upload', upload.single("avatar"), (req, res) => {
  res.json(req.file)
});

app.post('/try-uploads', upload.array("photos"), (req, res) => {
  res.json(req.files)
});

app.get('/my-params1/hello', (req, res) => {
  res.json({ hello: "yann" })
});


// 用變數設定路由 // 寬鬆的放後面
app.get('/my-params1/:action?/:id?', (req, res) => {
  res.json(req.params)
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
  let u = req.url.slice(3).split('?')[0];
  u = u.split('-').join('');
  res.send({ u });
});

app.use('/admins', admin2Router); // 當成 middleware 使用
app.use('/address-book', addressBookRouter); 

app.get('/try-sess', (req, res) => {
  req.session.n = req.session.n || 0;
  req.session.n++;
  res.json(req.session);
});

app.get('/try-moment', (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment();
  const m2 = moment("12-10-11");
  const m3 = moment("12-10-11","DD-MM-YY")
  const d1 = dayjs();
  const d2 = dayjs("2023-11-15");
  const a1 = new Date();
  const a2 = new Date("2023-11-15")

  res.json({
    m1:m1.format(fm),
    m2:m2.format(fm),
    m3:m3.format(fm),
    m1a:m1.tz("Europe/London").format(fm),
    d1:d1.format(fm),
    d2:d2.format(fm),
    a1,
    a2
  })
});

app.get("/try-db",async (req,res)=>{
  const [results,fields] = await db.query("SELECT * FROM `categories` WHERE 1");
  res.json({results,fields});

})

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