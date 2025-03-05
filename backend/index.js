const express = require('express')
const  router  = require('./Routes')
const mongoose  = require('mongoose')
const errorHandler = require('./Middlewares/errorHandler')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express()



const connectDB = async ()=>{
    try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    console.log("DB connected successfully")
        
    } catch (error) {
        console.log(error);
    }
}
connectDB()

app.use(cookieParser())
app.use(express.json())
app.use("/api/v1",router)
app.use(errorHandler)


app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})