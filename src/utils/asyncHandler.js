const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error))
    }
}

export {asyncHandler}
/*
const asyncHandler=()=>{} normal callback
const asyncHandler=(func)=>async()=>{} higher order function jo func parameter main hai usko execute krwa rhe hai ek aur call back bnakr
*/

// try catch asynchandler

// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }