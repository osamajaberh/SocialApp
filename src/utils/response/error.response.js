
export const asyncHandller = (fn)=>{
    return (req,res,next)=>{
        return fn (req,res,next).catch(error=>{
            error.cause=500;
            return next(error)
        })
    }

}


export const golobalErrorHandling = (error,req,res,next)=>{
    if(process.env.MOOD==="DEV"){
        return res.status(error.cause||400).json({message:error.message,error,stack:error.stack})

    }
     return res.status(error.cause||400).json({message:error.message,error})
}