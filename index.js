//import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import dayjs from "dayjs";
import mysql_session from "express-mysql-session";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import sales from "./data/sales.json" assert { type: "json" }; // import json檔目前是實驗性質的功能
//import multer from "multer";
//const upload = multer({dest:'tmp_uploads/'})
import upload from "./utils/upload-imgs.js";
import db from "./utils/connect-mysql.js";

import admin2Router from "./routes/admin2.js";
import addressBookRouter from "./routes/address-book.js";

const app = express();

// 設定樣版引擎
app.set("view engine", "ejs");

// top-level middlewares // 依檔頭Content-Type來決定是否解析
app.use(cors()); // 放所有路由的前面
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const MysqlStore = mysql_session(session);
const sessionStore = new MysqlStore({}, db);
app.use(
  session({
    saveUninitialized: false, // 新用戶沒有使用到 session 物件時不會建立 session 和發送 cookie
    resave: false, // 沒變更內容是否強制回存
    secret: "feagfegwevgv213",
    store: sessionStore,
    // cookie: {
    // maxAge: 1200_000, // 20分鐘，單位毫秒
    // },
  })
);

// 自訂頂層 middleware // 放後面
app.use((req, res, next) => {
  res.locals.title = "Yann 的網站"; // 將title設定為樣版屬性
  res.locals.pageName = "";
  // 把function利用 middleware 掛在template上
  res.locals.toDateString = (d) => dayjs(d).format("YYYY-MM-DD");
  res.locals.toDateTimeString = (d) => dayjs(d).format("YYYY-MM-DD HH:mm:ss");

  res.locals.session = req.session; // 讓 template 可以取用 session

  // 取得某一個 http header
  const auth = req.get("Authorization");
  if (auth && auth.indexOf("Bearer ") === 0) {
    const token = auth.slice(7); // 去掉 "Bearer "
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      //console.log({ payload });
      res.locals.jwt = payload;
    } catch (ex) {}
    // 測試用
    // res.locals.jwt = { id: 15, email: "shin@ttt.com" };
  }

  next(); //req,res 往下傳遞
});

// 定義路由,允許get方法拜訪
app.get("/", (req, res) => {
  res.locals.title = "首頁｜" + res.locals.title;
  res.render("home", { name: process.env.DB_NAME }); // 指定home樣版的檔案 // 傳遞name參數給樣版
});

app.get("/json-sales", (req, res) => {
  res.locals.title = "JSON資料 | " + res.locals.title;
  res.locals.pageName = "json-sales";
  res.render("json-sales", { sales });
});

app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

app.post("/try-post", (req, res) => {
  console.log("req.body:", req.body);
  res.json(req.body);
});

app.get("/try-post-form", (req, res) => {
  res.render("try-post-form");
});

app.post("/try-post-form", (req, res) => {
  res.render("try-post-form", req.body);
});

// 加入 middleware upload.single()
app.post("/try-upload", upload.single("avatar"), (req, res) => {
  //res.json(req.file);
  res.render("try-upload");
});

app.post("/try-uploads", upload.array("photos"), (req, res) => {
  res.json(req.files);
});

app.get("/my-params1/hello", (req, res) => {
  res.json({ hello: "yann" });
});

// 用變數設定路由 // 寬鬆的放後面
app.get("/my-params1/:action?/:id?", (req, res) => {
  res.json(req.params);
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
  let u = req.url.slice(3).split("?")[0];
  u = u.split("-").join("");
  res.send({ u });
});

app.use("/admins", admin2Router); // 當成 middleware 使用
app.use("/address-book", addressBookRouter);

app.get("/try-sess", (req, res) => {
  req.session.n = req.session.n || 0;
  req.session.n++;
  res.json(req.session);
});

app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment();
  const m2 = moment("12-10-11");
  const m3 = moment("12-10-11", "DD-MM-YY");
  const d1 = dayjs();
  const d2 = dayjs("2023-11-15");
  const a1 = new Date();
  const a2 = new Date("2023-11-15");

  res.json({
    m1: m1.format(fm),
    m2: m2.format(fm),
    m3: m3.format(fm),
    m1a: m1.tz("Europe/London").format(fm),
    d1: d1.format(fm),
    d2: d2.format(fm),
    a1,
    a2,
  });
});

app.get("/try-db", async (req, res) => {
  const [results, fields] = await db.query(
    "SELECT * FROM `categories` WHERE 1"
  );
  res.json({ results, fields });
});
app.get("/yahoo", async (req, res) => {
  const r = await fetch("https://tw.yahoo.com/"); // 後端 fetch 沒有cors問題
  const txt = await r.text();
  res.send(txt);
});
app.get("/login", async (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    postData: req.body,
  };
  if (!req.body.email || !req.body.password) {
    // 資料不足
    output.code = 410;
    return res.json(output);
  }

  // email 要是unique
  const sql = "SELECT * FROM members where email=?";
  const [rows] = await db.query(sql, [req.body.email]);

  if (!rows.length) {
    // 帳號是錯的
    output.code = 400;
    return res.json(output);
  }
  const row = rows[0];
  // 比較用戶輸入的密碼和資料庫查詢的密碼
  const pass = await bcrypt.compare(req.body.password, row.password);
  if (!pass) {
    // 密碼是錯的
    output.code = 420;
    return res.json(output);
  }
  // 資料正確
  output.code = 200;
  output.success = true;
  // 設定session
  req.session.admin = {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
  };
  output.member = req.session.admin;
  res.json(output);
});
app.get("/logout", async (req, res) => {
  // delete 刪除物件的屬性，把session的admin屬性刪掉
  delete req.session.admin;

  // 轉向首頁
  res.redirect("/");
});

app.get("/try-jwt-1", async (req, res) => {
  // jwt 加密
  const token = jwt.sign({ id: 12, account: "shin" }, process.env.JWT_SECRET);

  res.json({ token });
});
app.get("/try-jwt-2", async (req, res) => {
  // jwt 解密
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImFjY291bnQiOiJzaGluIiwiaWF0IjoxNzAzNTYxNzQzfQ.uNTpcLTD-rsBuJ4TR947mK9Ii09JAkFx3iChAvurkoc";
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  res.json({ payload });
});

app.post("/login-jwt", async (req, res) => {
  const output = {
    success: false,
    code: 0,
    postData: req.body,
    id: 0,
    email: "",
    nickname: "",
    token: "",
  };
  if (!req.body.email || !req.body.password) {
    // 資料不足
    output.code = 410;
    return res.json(output);
  }
  const sql = "SELECT * FROM members WHERE email=?";
  const [rows] = await db.query(sql, [req.body.email]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 400;
    return res.json(output);
  }
  const row = rows[0];
  const pass = await bcrypt.compare(req.body.password, row.password);
  if (!pass) {
    // 密碼是錯的
    output.code = 420;
    return res.json(output);
  }
  output.code = 200;
  output.success = true;
  output.id = row.id;
  output.email = row.email;
  output.nickname = row.nickname;
  output.token = jwt.sign(
    { id: row.id, email: row.email },
    process.env.JWT_SECRET
  );
  res.json(output);
});

// app.get("/a.html", (req, res) => {
//   res.send(`假的 a.html`);
// });

// 取得會員自己的資料
app.get("/profile", async (req, res) => {
  // res.locals.jwt: {id, email}
  const output = {
    success: false,
    error: "",
    data: {},
  };
  if (!res.locals.jwt?.id) {
    output.error = "沒有權限";
    return res.json(output);
  }
  const [rows] = await db.query(
    "SELECT `id`, `email`, `mobile`, `birthday`, `nickname` FROM `members` WHERE id=?",
    [res.locals.jwt.id]
  );
  if (!rows.length) {
    output.error = "沒有這個會員";
    return res.json(output);
  }
  output.success = true;
  output.data = rows[0];
  res.json(output);
});

// 設定靜態內容的資料夾 // public裡面的內容相當於在根目錄
app.use(express.static("public")); // app.use("/",express.static("public"));
// 靜態內容的資料夾對應到 /bootstrap底下
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use("/jquery", express.static("node_modules/jquery/dist"));

// 404 // 要放在別的路由後面 // .use是所有的方法
app.use((req, res) => {
  res.status(404).send(`<h1>你迷路了</h1>`);
});

const port = process.env.WEB_PORT || 3001; // 如果沒設定就使用3001

app.listen(port, () => {
  console.log(`express server ${port}`);
});
