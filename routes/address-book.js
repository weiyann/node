import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

router.get('/', async (req, res) => {

  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1;
  let totalRows;
  let totalPages;
  let rows = [];

  if (page < 1) {
    //return res.redirect(req.baseUrl)
    return res.redirect(`?page=1`)
  }

  const t_sql = "select count(1) totalRows from address_book";
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  if (totalRows > 0) {
    if (page > totalPages) {
      return res.redirect(`?page=${totalPages}`)
    }

    const sql = `SELECT * FROM address_book order by sid desc
    LIMIT ${(page-1)*perPage},${perPage}`;
    [rows] = await db.query(sql);

  }

  res.render('address-book/list',{
    page,
    totalRows,
    totalPages,
    rows
  });

  // const sql = "SELECT * FROM address_book ORDER BY sid DESC LIMIT 5";
  // const [rows] = await db.query(sql);
  // res.json(rows)
})

export default router;