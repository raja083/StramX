
const asyncHandler = (fn) => async (req,res,next) =>{
    try {
        await fn(req,res,next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

export {asyncHandler};

// in every code we have to handle the async await so instead of defining and writing them repetitively, we can use this function everywhere.
