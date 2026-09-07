const {Server} = require("socket.io")

let io ; 

module.exports = {
    init : (server) => {
       io =  new Server(server , {
        cors :{
            origin  : process.env.Url_Admin_Front ,
            methods : ["GET" , "POST"]
        }
       } )
       return io
    } ,
    getIo: () => {
        if (!io) {
            throw new Error("Socket.io is not initialized!");
        }
        return io;
    }
}