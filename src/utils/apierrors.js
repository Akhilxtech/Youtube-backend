class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        error=[],
        stack=""
    ){
        // override
        super(message)// call constructor of parent class
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors=error;

        if(stack){
            this.stack=stack;
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}