import bcrypt from "bcryptjs";
const pw = "123456";
const hash = await bcrypt.hash(pw, 8);
console.log(hash);