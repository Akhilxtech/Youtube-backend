import app from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"


dotenv.config({
    path:"./.env"
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running at port:${process.env.PORT} `);
    })
//app.on use to catch errors after sever starts success fully
    app.on("error",(error)=>{
        console.log("Error:",error);
        throw error
        
    })
})
.catch((err)=>{
    console.log(`Mongo db connection falied!!! ${err}`);
    
})











/*
// approach 1 of connecting db
const app=express();
(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("on",(error)=>{
            console.log("ERROR:",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port:${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error("ERROR:",error);
        throw error;
        
    }
})()// iffes

*/