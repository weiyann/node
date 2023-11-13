import http from "node:http";

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf8'

  })

  res.end(`
  <h2>hello</h2>
  <p>${req.url}</p>
  `);
});

server.listen(3000) 