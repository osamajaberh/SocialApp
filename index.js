import path from "node:path"
import * as dotenv from "dotenv";
dotenv.config({path:path.resolve("./src/config/.env.dev")});
import express from "express"
import bootstarp from "./src/app.controller.js";

const app = express();

const PORT = process.env.PORT||5000;

bootstarp(app,express)


app.listen(PORT,()=>{
    console.log(`Server is Running on Port ${PORT}`);
    
})