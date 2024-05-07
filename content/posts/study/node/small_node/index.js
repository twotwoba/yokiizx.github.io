const server = require('./server');
const router = require('./route');
const handler = require('./requestHandler');

const handle = {
  '/': handler.start,
  '/start': handler.start,
  '/upload': handler.upload,
  '/form': handler.form
};

server.start(router.route, handle);
