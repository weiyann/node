import express from "express";
import db from './../utils/connect-mysql.js';

const router = express.Router();

router.get('/', async (req,res)=>{
  const sql = "SELECT * FROM address_book ORDER BY sid DESC LIMIT 5";
  const [rows] = await db.query(sql);
  res.json(rows)
})

export default router;