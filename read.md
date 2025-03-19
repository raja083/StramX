# project : This is a project on backend

# code explaination : mongodb connection

(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error",(error)=>{   **this is a listener used to handle if the express app is not able to interact with the database**
            console.log("ERR:",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.log("ERROR:",error);
        throw error
    }
})()

EXPLANATION : 
1. First of all this is an **IFFE** function (immediately executed).
2. The process of database connection can be problematic hence to handle the error while connecting it uses **TRY-CATCH** block.
3. The database is always situated in another continent( far-off). Hence the connection may take some time. So **async-await** is used.

