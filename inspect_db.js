const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT DISTINCT issuer, COUNT(*) as count FROM bins GROUP BY issuer', [], (err, rows) => {
  if (err) {
    fs.writeFileSync('db_report.txt', 'Error: ' + err.message);
  } else {
    fs.writeFileSync('db_report.txt', JSON.stringify(rows, null, 2));
  }
  db.close();
});
