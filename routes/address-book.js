import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

router.get('/', async (req, res) => {

  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1;
  let totalRows;
  let totalPages;
  let rows = [];

  const t_sql = "select count(1) totalRows from address_book";
  [[{ totalRows }]] = await db.query(t_sql);
  totalPages = Math.ceil(totalRows / perPage);
  res.json({
    page,
    totalRows,
    totalPages});

  // const sql = "SELECT * FROM address_book ORDER BY sid DESC LIMIT 5";
  // const [rows] = await db.query(sql);
  // res.json(rows)
})

export default router;