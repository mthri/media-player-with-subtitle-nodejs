var http = require('http')
var url = require('url')
var Handler = require('./RequestHandler')

var PORT = process.env.PORT || 8585

http.createServer((req, res) => {
    var path = url.parse(req.url).pathname
    var param = url.parse(req.url, true).query
    Handler.RequestHandler(path,req,res,param)
}).listen(PORT)

console.log('server started ...')
