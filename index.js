if (!process.env.SUBDIR) {
  throw new Error('Env SUBDIR not defined');
}

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const moment = require('moment');
const extract = require('extract-zip');
const find = require('find');

let debugSystem = require('debug')('system');
let debugSqlite3 = require('debug')('sqlite3');
let debugDownload = require('debug')('download');

class Product {
  constructor(id, createdAt, size, collectionId) {
    this.id = id;
    this.createdAt = createdAt;
    this.size = size;
    this.collectionId = collectionId;
  }

  static fromRaw(raw) {
    return new Product(raw.ProductID, raw.AcquisitionDate, raw.Size, raw.CollectionID);
  }

  static fromRow(row) {
    return new Product(row.id, row.createdAt, row.size, row.collectionId);
  }

  toString() {
    return JSON.stringify({
      id: this.id,
      createdAt: this.createdAt,
      size: this.size,
      collectionId: this.collectionId,
    });
  }
}

const parse = require('csv-parse/lib/sync');

const CSV_FILE_NAME = 'ProductList.csv';
const CSV_LEFT_PRODUCT_FILE_NAME = 'LeftProduct.csv';

function parseProductData(filePath) {
  return parse(fs.readFileSync(filePath), {
    columns: true,
    skip_empty_lines: true
  }).map(record => Product.fromRaw(record));
}

const SQLITE_DB_PATH = path.join(__dirname, './sqlite.data');
fs.closeSync(fs.openSync(SQLITE_DB_PATH, 'a'));
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(SQLITE_DB_PATH);

function initializeProductData() {
  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS products (" +
      "id TEXT, " +
      "createdAt TIMESTAMP, " +
      "size TEXT, " +
      "collectionId TEXT, " +
      "UNIQUE(id, collectionId)" +
    ")");

    var stmt = db.prepare("INSERT OR IGNORE INTO products VALUES (?, ?, ?, ?)");
    parseProductData(path.join(__dirname, 'csv', CSV_FILE_NAME)).forEach(product => {
      stmt.run(product.id, product.createdAt, product.size, product.collectionId);
    });
    stmt.finalize();

    db.each("SELECT id, createdAt, size, collectionId FROM products", function(err, row) {
      debugSqlite3(Product.fromRow(row).toString());
    });
  });
}

const express = require('express');

const DOWNLOAD_BASE_PATH = path.join(__dirname, 's', process.env.SUBDIR);

function getCollectionZipPath(collectionId) {
  return path.join(DOWNLOAD_BASE_PATH, `${collectionId}.zip`);
}

function getCollectionDirPath(collectionId) {
  return path.join(DOWNLOAD_BASE_PATH, `${collectionId}`);
}

class ProductDownloadManager {
  constructor() {
    this.baseUrl = 'https://scihub.copernicus.eu/dhus/odata/v1/';
  }

  async downloadFile(collectionId) {
    debugDownload(`Download started: ${collectionId}\n\t on ${moment()}`);
    const writer = fs.createWriteStream(getCollectionZipPath(collectionId));

    return axios({
      method: 'get',
      url: this.baseUrl + `Products(\'${collectionId}\')/\\$value`,
      responseType: 'stream',
      auth: {
        username: 'undersite',
        password: 'helloworld!',
      },
    }).then(response => {

      //ensure that the user can call `then()` only when the file has
      //been downloaded entirely.

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        let error = null;
        writer.on('error', err => {
          error = err;
          writer.close();
          reject(err);
        });
        writer.on('close', () => {
          if (!error) {
            debugDownload(`Download finish: ${collectionId}\n\t on ${moment()}`);
            resolve(collectionId);
          }
        });
      });
    });
  }
}

async function downloadBy(products) {
  const downloadManager = new ProductDownloadManager();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    await downloadManager.downloadFile(product.collectionId)
      .then(collectionId => unzipProduct(collectionId));
  }
}

function downloadProducts(products) {
  if (products) {
    return downloadBy(products);
  }
  const downloadManager = new ProductDownloadManager();

  db.all("SELECT id, createdAt, size, collectionId FROM products", async function(err, rows) {
    for (let i = 0; i < rows.length; i++) {
      const product = rows[i];
      await downloadManager.downloadFile(product.collectionId)
        .then(collectionId => unzipProduct(collectionId));
    }
  });
}

function unzipProduct(collectionId) {
  return extract(getCollectionZipPath(collectionId), {
    dir: getCollectionDirPath(collectionId),
  }).then(() => fs.unlinkSync(getCollectionZipPath(collectionId)));
}

/*
* Execution
* */


if (process.env.NODE_ENV === 'bootstrap') {
  initializeProductData();
  downloadProducts();
}

if (process.env.NODE_ENV === 'keep') {
  const products = parseProductData(path.join(__dirname, 'csv', CSV_LEFT_PRODUCT_FILE_NAME));
  debugSystem('Start download for these products');
  debugSystem(products);
  downloadProducts(products);
}

const PORT = 7070;
const HOST = '0.0.0.0';

const app = express();
app.get('/', (req, res) => {
  res.send({
    message: 'Sentinel Server',
  });
});

app.get('/downloads/:subdir/:id', (req, res) => {
  res.download(path.join(__dirname, req.params.subdir, req.params.id));
});

app.get('/downloads-2', (req, res) => {
  res.send({
    message: 'Sentinel Server',
  });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

