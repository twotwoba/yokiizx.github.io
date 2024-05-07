const exec = require('child_process').exec;
function start(response) {
  console.log('start...');
  let content = 'empty';
  exec('ls -lah', function (error, stdout, stderr) {
    content = stdout;
    response.write(content);
    response.end();
  });
  // return content; // exec 是异步的, 所以仍然是 empty  怎么办呢?  传递函数 --- 把response拿过来即可...
}
function upload(response, postData) {
  console.log('upload...');
  response.write('You write <br />' + postData);
  response.end();
}

function form(response) {
  console.log("Request handler 'form' was called.");

  var body =
    '<html>' +
    '<head>' +
    '<meta http-equiv="Content-Type" content="text/html; ' +
    'charset=UTF-8" />' +
    '</head>' +
    '<body>' +
    '<form action="/upload" method="post">' +
    '<textarea name="text" rows="20" cols="60"></textarea>' +
    '<input type="submit" value="Submit text" />' +
    '</form>' +
    '</body>' +
    '</html>';

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(body);
  response.end();
}

exports.start = start;
exports.upload = upload;
exports.form = form;
