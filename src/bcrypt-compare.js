import bcrypt from "bcryptjs";


const hash = "$2a$08$09txwIC.VvRZIUDkh21M8egZh5sWGe4SZRJbuWuAd/XoH4eQP2/Pe";

console.log(await bcrypt.compare("123456",hash));
