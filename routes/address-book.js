import express from "express";
import db from "./../utils/connect-mysql.js";
import upload from "./../utils/upload-imgs.js";
import dayjs from "dayjs";

const router = express.Router();

router.use((req, res, next) => {
  const u = req.url.split("?")[0]; // 只要路徑
  console.log({ u });
  if (req.method === "GET" && u === "/") {
    // 如果請求是GET方法,路徑是列表就通過
    return next();
  }
  /*
  if (!req.session.admin) {
    return res.redirect("/login");
  }*/
  next();
});

// 定義獲得資料列表的函數
const getListData = async (req) => {
  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1; // 用戶決定要看第幾頁
  let keyword =
    req.query.keyword && typeof req.query.keyword === "string"
      ? req.query.keyword.trim()
      : "";
  let keyword_ = db.escape(`%${keyword}%`); // 跳脫

  let qs = {}; // 用來把 query string 的設定傳給 template

  // 起始的日期
  let startDate = req.query.startDate ? req.query.startDate.trim() : "";
  const startDateD = dayjs(startDate);
  if (startDateD.isValid()) {
    //如果是合法的
    startDate = startDateD.format("YYYY-MM-DD");
  } else {
    startDate = "";
  }

  // 結束的日期
  let endDate = req.query.endDate ? req.query.endDate.trim() : "";
  const endDateD = dayjs(endDate);
  if (endDateD.isValid()) {
    //如果是合法的
    endDate = endDateD.format("YYYY-MM-DD");
  } else {
    endDate = "";
  }

  let where = `WHERE 1 `; // 1後面要有空白 // 開頭
  if (keyword) {
    // 如果有提供關鍵字，將其加入 qs 物件中，以便後續在模板中使用
    qs.keyword = keyword;
    where += `AND(\`name\`LIKE${keyword_} OR \`mobile\`LIKE${keyword_})`;
  }
  if (startDate) {
    qs.startDate = startDate;
    where += `AND birthday >= '${startDate}'`;
  }
  if (endDate) {
    qs.endDate = endDate;
    where += `AND birthday <= '${endDate}'`;
  }

  let totalRows = 0;
  let totalPages = 0;
  let rows = [];

  let output = {
    success: false,
    page,
    perPage,
    rows,
    totalRows,
    totalPages,
    qs,
    redirect: "",
    info: "",
  };

  // 如果頁碼小於1,導向第一頁
  if (page < 1) {
    output.redirect = `?page=1`;
    output.info = `頁碼值小於1`;
    return output;
  }

  const t_sql = `select count(1) totalRows from address_book ${where}`;
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      // 展開運算符 { ...output } 做淺層複製，將 output 物件中的所有屬性複製到這個新的物件中。同時，你可以在展開的同時添加其他屬性
      // 將 totalRows 和totalPages 最新的值放在output中
      return { ...output, totalRows, totalPages };
    }

    const sql = `SELECT * FROM address_book ${where} order by sid desc
      LIMIT ${(page - 1) * perPage},${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages };
  }

  return output;
};

// 網頁呈現資料
router.get("/", async (req, res) => {
  res.locals.pageName = "ab-list";
  res.locals.title = "列表 | " + res.locals.title;
  // 將 getListData 裡 output 的值返回給外面的 output
  const output = await getListData(req);
  if (output.redirect) {
    // 如果有redirect屬性，執行轉向 // 加return結束，不用再執行下面的render
    return res.redirect(output.redirect);
  }
  // 如果沒有admin就到閹割版列表，有就到一般列表
  if (!req.session.admin) {
    res.render("address-book/list-no-admin", output);
  } else {
    res.render("address-book/list", output);
  }
});

// api 呈現資料
router.get("/api", async (req, res) => {
  res.json(await getListData(req));
});
router.get("/add", async (req, res) => {
  res.locals.pageName = "ab-add";
  res.locals.title = "新增 | " + res.locals.title;
  res.render("address-book/add");
});
router.post("/add", upload.none(), async (req, res) => {
  // 用upload.none() 處理表單數據
  const output = {
    success: false,
    postData: req.body, // 除錯用
  };

  const { name, email, mobile, birthday, address } = req.body;
  const sql =
    "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?,NOW())";

  try {
    const [result] = await db.query(sql, [
      name,
      email,
      mobile,
      birthday,
      address,
    ]);
    // 定義一個 output 的屬性 result 把 SQL查詢的值給他
    output.result = result;
    // 如果 affectedRows 是1就是true,0就是false
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.exception = ex;
  }
  /*
  const sql = "INSERT INTO `address_book` SET ?";
  // INSERT INTO `address_book` SET `name`=`abc`
  req.body.created_at = new Date();
  const [result] = await db.query(sql, [req.body]);
  */
  /*
  {
    "fieldCount": 0,    # 查詢的列數
    "affectedRows": 1,  # 影響的列數
    "insertId": 1015,   # 取得的PK
    "info": "",         # 附加的信息, 通常是空字串
    "serverStatus": 2,  # 服務器的狀態碼，此處為2。這個屬性表示MySQL服務器的狀態。
    "warningStatus": 0, # 警告的狀態碼，此處為0，表示沒有警告。
    "changedRows": 0    # 修正時真正有變動的資料筆數
}
  */

  res.json(output);
});
// router.post('/add',async (req, res) => {
//   res.json(req.body)
// })
router.get("/edit/:sid", async (req, res) => {
  const sid = +req.params.sid;
  res.locals.title = "編輯 | " + res.locals.title;
  const sql = `SELECT * FROM address_book where sid=?`;
  const [rows] = await db.query(sql, [sid]);
  // if(rows?.length) 如果rows有值就取它的屬性length
  if (!rows.length) {
    // 如果沒資料就轉向
    return res.redirect(req.baseUrl);
  }
  const row = rows[0];
  row.birthday2 = dayjs(row.birthday).format("YYYY-MM-DD");

  res.render("address-book/edit", row);
});

// 取得單筆的資料
router.get("/api/edit/:sid", async (req, res) => {
  const sid = +req.params.sid;

  const sql = `SELECT * FROM address_book where sid=?`;
  const [rows] = await db.query(sql, [sid]);
  // if(rows?.length) 如果rows有值就取它的屬性length
  if (!rows.length) {
    return res.json({ success: false });
  }
  const row = rows[0];
  row.birthday = dayjs(row.birthday).format("YYYY-MM-DD");

  res.json({ success: true, row });
});

router.put("/edit/:sid", async (req, res) => {
  const output = {
    success: false,
    postData: req.body,
    result: null,
  };

  req.body.address = req.body.address.trim(); // 去除頭尾空白
  const sql = `UPDATE address_book SET ? WHERE sid=?`;
  const [result] = await db.query(sql, [req.body, req.body.sid]);
  output.result = result;
  output.success = !!result.changedRows; // changedRows 實際有變動的資料筆數

  res.json(output);
});

router.delete("/:sid", async (req, res) => {
  const output = {
    success: false,
    result: null,
  };
  const sid = +req.params.sid;
  if (!sid || sid < 1) {
    return res.json(output);
  }

  const sql = `DELETE FROM address_book where sid=${sid}`;
  const [result] = await db.query(sql);
  output.result = result;
  output.success = !!result.affectedRows;
  res.json(output);
});
export default router;
