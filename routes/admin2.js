import express from "express";

const router = express.Router();

router.get('/admin2/:p1?/:p2?',(req,res)=>{
  const {
    url,
    baseUrl,
    originalUrl,
    params:{p1,p2}, // 使用解構賦值取得路由參數
  }=req;

  res.json({
    url,
    baseUrl,
    originalUrl,
    p1,
    p2,
  })
})

export default router;