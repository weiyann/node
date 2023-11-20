import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

// 定義獲得資料列表的函數
const getListData = async (req) => {
  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1;
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

    redirect: "",
    info: ""
  }

  if (page < 1) {
    output.redirect = `?page=1`;
    output.info = `頁碼值小於1`
    return output;
  }

  const t_sql = "select count(1) totalRows from address_book";
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      output.redirect = `?page=${totalPages}`;
      output.info = `頁碼值大於總頁數`;
      // 展開運算符 { ...output } 的作用是創建一個新的物件，將 output 物件中的所有屬性複製到這個新的物件中。同時，你可以在展開的同時添加其他屬性
      // 將 totalRows 和totalPages 最新的值放在output中
      return { ...output, totalRows, totalPages };
    }

    const sql = `SELECT * FROM address_book order by sid desc
      LIMIT ${(page - 1) * perPage},${perPage}`;
    [rows] = await db.query(sql);
    output = { ...output, success: true, rows, totalRows, totalPages }

  }

  return output

}

// 網頁呈現資料
router.get('/', async (req, res) => {
  res.locals.pageName='ab-list'
  const output = await getListData(req);
  if (output.redirect) {
    // 如果有重定向屬性，執行重定向
    return res.redirect(output.redirect);
  }
  res.render('address-book/list', output)
})

// api 呈現資料
router.get('/api', async (req, res) => {
  res.json(await getListData(req))
})

export default router;
