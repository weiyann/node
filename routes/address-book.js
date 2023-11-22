import express from "express";
import db from './../utils/connect-mysql.js';
import upload from "./../utils/upload-imgs.js";

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
    info: "",
  }

  // 如果頁碼小於1,導向第一頁
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
      // 展開運算符 { ...output } 做淺層複製，將 output 物件中的所有屬性複製到這個新的物件中。同時，你可以在展開的同時添加其他屬性
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
  res.locals.pageName = 'ab-list';
  res.locals.title="列表 | "+res.locals.title;
  // 將 getListData 裡 output 的值返回給外面的 output
  const output = await getListData(req);
  if (output.redirect) {
    // 如果有redirect屬性，執行轉向 // 加return結束，不用再執行下面的render
    return res.redirect(output.redirect);
  }
  // 沒轉向就一般呈現list
  res.render('address-book/list', output)
})

// api 呈現資料
router.get('/api', async (req, res) => {
  res.json(await getListData(req))
})
router.get('/add', async (req, res) => {
  res.locals.pageName = 'ab-add'
  res.locals.title="新增 | "+res.locals.title;
  res.render('address-book/add')
})
router.post('/add', upload.none(), async (req, res) => {
  // 用upload.none() 處理表單數據
  const output ={
    success:false,
    postData:req.body, // 除錯用
  }
  
  const { name, email, mobile, birthday, address } = req.body;
  const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?,NOW())"
  
  try{
    const [result] = await db.query(sql, [
      name, 
      email, 
      mobile, 
      birthday, 
      address
    ]);
    // 定義一個 output 的屬性 result 把 SQL查詢的值給他
    output.result =result;
    // 如果 affectedRows 是1就是true,0就是false
    output.success=!!result.affectedRows;
  }catch(ex){
    output.exception=ex;
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
})
// router.post('/add',async (req, res) => {
//   res.json(req.body)
// })
router.get('/edit/:sid', async (req, res) => {
  const sid = +req.params.sid;
  res.locals.title="編輯 | "+res.locals.title;
  const sql = `SELECT * FROM address_book where sid=?`;
  const[rows]=await db.query(sql,[sid]);
  // if(rows?.length) 如果rows有值就取它的屬性length
  if(!rows.length){
    // 如果沒資料就轉向
    return res.redirect(req.baseUrl);
  }
  // 回傳第一筆資料
  res.render("address-book/edit",rows[0]);
})

router.delete('/:sid', async (req, res) => {
  const output={
    success:false,
    result:null,
  }
  const sid = + req.params.sid;
  if(!sid || sid<1){
    return res.json(output);
  }

  const sql = `DELETE FROM address_book where sid=${sid}`;
  const[result]=await db.query(sql);
  output.result = result;
  output.success = !!result.affectedRows;
  res.json(output);
})
export default router;
