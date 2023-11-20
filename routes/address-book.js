import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

const getListData = async (req, res) => {

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
  
    return {
      page,
      totalRows,
      totalPages,
      rows
    };
  
  }


router.get('/',async (req, res) => {
  res.render('address-book/list',await getListData(req,res))
})

router.get('/api', async (req, res) => {
  res.json(await getListData(req,res))
})

export default router;
