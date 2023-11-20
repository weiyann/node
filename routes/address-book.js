import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

const getListData = async (req) => {
  const perPage = 20; // 每頁幾筆
  let page = +req.query.page || 1;
  let totalRows = 0;
  let totalPages = 0;
  let rows = [];

  let output={
    success:false,
    page,
    perPage,
    rows,
    totalRows,
    totalPages,

    redirect:"",
    info:""
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
      output.info = `頁碼值大於總頁數`
      return {...output,totalRows,totalPages};
    }

    const sql = `SELECT * FROM address_book order by sid desc
      LIMIT ${(page - 1) * perPage},${perPage}`;
    [rows] = await db.query(sql);
    output.success = true;
    output.rows = rows;

  }

  return output

}


router.get('/', async (req, res) => {
  const output = await getListData(req);
  if(output.redirect){
    return res.redirect(output.redirect);
  }
  res.render('address-book/list', output)
})

router.get('/api', async (req, res) => {
  res.json(await getListData(req))
})

export default router;
