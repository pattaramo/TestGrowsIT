require('dotenv').config();
const http = require('http');
const mysql = require('mysql2/promise');

const { APP_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_HOSTNAME, MYSQL_PORT, MYSQL_DB } = process.env;

const dbConnectionString = `mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@${MYSQL_HOSTNAME}:${MYSQL_PORT}/${MYSQL_DB}`;

async function startApp() {
  const db = await mysql.createConnection(dbConnectionString);

  const server = http.createServer(async (request, response) => {
    const { method, url } = request;

    if (method === 'GET' && url === '/') {
      try {
        const results = await db.query('SELECT * FROM book');
        const results2 = await db.query('SELECT book.idstatus, status.status FROM book JOIN status ON book.idstatus = status.idstatus;');

        const resultString = results[0].map(item => `<p>bookname: ${item.bookname}, author: ${item.author}, year: ${item.year}</p>`).toString();
        const resultString2 = results2[0].map(item => `<p>status: ${item.status}</p>`).toString();

        response.setHeader('Content-Type', 'text/html; charset=UTF-8');
        response.statusCode = 200;
        response.end(`
          <h1>Homepage</h1>
          ${resultString}${resultString2}
          <h2>Status Dropdown:</h2>
          <form method="post" action="/update">
            <select name="status" id="new_customer_id">
              ${resultString2}
              <option value="11">have</option>
              <option value="22">without</option>
            </select>
            <input type="submit" value="Submit">
          </form>
        `);
      } catch (error) {
        console.error('Error:', error.message);
        response.statusCode = 500;
        response.end('Internal Server Error');
      }
    } else if (method === 'POST' && url === '/update') {
      try {
        let body = '';
        request.on('data', (data) => {
          body += data;
        });

        request.on('end', async () => {
          const postData = new URLSearchParams(body);
          const selectedStatus = postData.get('status');

          await db.query(`UPDATE book SET idstatus = ? WHERE idstatus IN (?)`, [selectedStatus, [11, 22]]);

          response.statusCode = 302;
          response.setHeader('Location', '/');
          response.end();
        });
      } catch (error) {
        console.error('Error:', error.message);
        response.statusCode = 500;
        response.end('Internal Server Error');
      }
    }
  });

  server.listen(APP_PORT, () => {
    console.log(`Server is started, on port ${APP_PORT}`);
  });
}

startApp();
