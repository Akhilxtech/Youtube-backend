import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential:true
}))  

app.use(express.json({limit: "50kb"}))// form bhrne per jo data ayega vo config kia]
app.use(express.urlencoded({extended:true,limit:"50kb"}))// url se jo data ayega usko config krega
app.use(express.static("public"))// jo file upload krte ho like images favicon video anything usko apne server main rkhne ke liye config add karta hai
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"

// routes declaration
app.use("/api/v1/users",userRouter)
export default app;