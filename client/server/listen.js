module.exports = {
    listen: function(server, PORT){
        server.listen(PORT,()=>{
            console.log(`Server running on port ${PORT}`);
            console.log("Data loaded from JSON file on startup");
        });
    }
}
