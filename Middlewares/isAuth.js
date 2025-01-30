const jwt = require('jsonwebtoken')


const isAuth = ((req,res,next)=>{
    // const token = req.headers.authorization.split(" ")[1]
    const token = req.cookies.token

    if(!token){
        throw new Error("Token not found")
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
    if(!decoded){
            throw new Error("Token not verified")
        }
    req.user = decoded
    next()
    }
)

module.exports = isAuth