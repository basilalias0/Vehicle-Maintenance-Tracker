const errorHandler = ((err,req,res,next)=>{
    res.status(err.status || 500).json({
        message:err.message || "error fetching details",
        stack:err.stack,
        status: err.status || 500
    })
})

module.exports = errorHandler