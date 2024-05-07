function route(pathname, handle, response, postData) {
  if (pathname === '/favicon.ico') return '';
  console.log('received ----- ' + pathname);
  if (typeof handle[pathname] === 'function') {
    return handle[pathname](response, postData);
  } else {
    console.log('404 not Found');
    return '404 ...';
  }
}

exports.route = route;
