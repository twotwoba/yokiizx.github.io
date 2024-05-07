const http = require('http');
const url = require('url');

function start(route, handle) {
  http
    .createServer((req, res) => {
      const pathname = url.parse(req.url).pathname;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      // 1. 初学
      // const content = route(pathname, handle); // 函数式编程的体现，我需要的不是 route 这个东西， 而是一个动作。route把这些动作做完即可
      // res.write(content);
      // res.end();
      // 2. 初学2 异步非阻塞
      // route(pathname, handle, res); // 把res传递, 解决异步问题, 实现非阻塞方式
      // 3. 处理post请求
      var postData = '';
      req.setEncoding('utf8');
      req.addListener('data', function (postDataChunk) {
        postData += postDataChunk;
        console.log("Received POST data chunk '" + postDataChunk + "'.");
      });
      req.addListener('end', function () {
        route(pathname, handle, res, postData);
      });
    })
    .listen(8888);
  console.log('Server has started...');
}

// module.exports = start;
exports.start = start;
