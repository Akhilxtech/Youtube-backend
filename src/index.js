import connectDB from "./db/index.js";
import dotenv from "dotenv"


dotenv.config({
    path:"./.env"
})

connectDB();











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