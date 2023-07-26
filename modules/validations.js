const fs = require('fs');
const xml2js = require('xml2js');
var path = require('path');
const { parse } = require('csv-parse');
const xmlParser = new xml2js.Parser({ attrkey: 'ATTR' });
const excelJS = require('exceljs');

async function validateOrders(req, res) { //main function
  var files = req.files;
  var referenceIds = []
  var excelData = []
  for (var i = 0; i < files.length; i++) { //iterating through all uploaded files
    var filePath = files[i].path;
    var fileExt = files[i].mimetype
    var absoluteFilePath = path.join(__dirname, '..', filePath); //forming absolute path
    var dataToBeValidated = [];
    if (fileExt == "text/csv") {
      dataToBeValidated = await getDataFromCSVfile(absoluteFilePath); //load csv file content as JSON data
    } else if (fileExt == "text/xml") {
      dataToBeValidated = await getDataFromXMLfile(absoluteFilePath); //load xml file content as JSON data
    }
    dataToBeValidated.forEach((record) => {
      let isTransactionValidStatus = isTransactionValid(record); //checking if startBalance and endbalance are matching
      let isReferenceUniqueStatus = isReferenceUnique(record, referenceIds); //checking if there any duplicate reference ids
      if (!isTransactionValidStatus) {
        record['errorStatus'] = "error in startValue/mutation/endbalance";
        excelData.push(record);
      }
      if (!isReferenceUniqueStatus) {
        record['errorStatus'] = "duplicate referenceid";
        excelData.push(record);
      }
      referenceIds.push(record.reference)
    });
  }
  createExcelsheet(excelData, ({ excelCreationStatus, filePath }) => { //to create final excel sheet
    if (excelCreationStatus == 'success') {
      res.send({ "status": "success", "filePath": filePath });
    } else {
      res.send({
        status: 'error',
        message: 'report creation failed',
      });
    }
  });
}

async function createExcelsheet(dataForExcelSheet, callback) { //to create excelsheet
  var downloadFilePath = path.join(__dirname, '..', 'public', 'record.xlsx');
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet('validationReport');
  worksheet.columns = [
    { header: 'Reference', key: 'reference', width: 10 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Error', key: 'errorStatus', width: 50 },
  ];
  dataForExcelSheet.forEach((item) => {
    worksheet.addRow(item);
  });
  try {
    await workbook.xlsx.writeFile(downloadFilePath).then(() => {
      console.log('excelsheet created ' + downloadFilePath);
      callback({ excelCreationStatus: 'success', filePath: downloadFilePath });
    });
  } catch (err) {
    callback({ excelCreationStatus: 'failed' });
  }
}

function isReferenceUnique(record, referenceIds) { //to check if there any duplicate reference ids
  var statusToSend = true;
  let currentReference = record.reference;
  let stat = referenceIds.includes(currentReference)
  if (referenceIds.includes(currentReference)) {
    statusToSend = false;
  }
  return statusToSend;
}

function isTransactionValid(record) { //to check if startBalance and endbalance are matching
  var statusToSend = true;
  let startBalance = parseFloat(record.startBalance);
  let endBalance = parseFloat(record.endBalance);
  let mutation = parseFloat(record.mutation);
  let transactionDifference = (startBalance + mutation).toFixed(2);
  if (transactionDifference != endBalance) {
    statusToSend = false;
  }
  return statusToSend;
}

async function getDataFromCSVfile(absoluteFilePath) { //to load data from csv file
  var dataHeader = 'reference,accountNumber,description,startBalance,mutation,endBalance'.split(',');
  var dataArray = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(absoluteFilePath)
      .pipe(parse({ delimiter: ',', from_line: 2 }))
      .on('data', function (row) {
        let tempObj = {};
        row.forEach((item, i) => {
          let key = dataHeader[i];
          tempObj[key] = item;
        });
        dataArray.push(tempObj);
      })
      .on('error', function (error) {
        reject();
      })
      .on('end', function () {
        resolve();
      });
  });
  return dataArray;
}

async function getDataFromXMLfile(absoluteFilePath) { //to load data from xml file
  return await new Promise((resolve, reject) => {
    let xml_string = fs.readFileSync(absoluteFilePath, 'utf8');
    xmlParser.parseString(xml_string, function (error, res) {
      let result = res.records.record;
      if (error === null) {
        result.forEach((item, i) => {
          item['reference'] = item['ATTR']['reference'];
          Object.keys(item).forEach((key) => {
            let currentvalue = item[key]
            if (currentvalue instanceof Array) {
              item[key] = currentvalue[0]
            }
          })
        });
        resolve(result);
      } else {
        reject();
      }
    });
  });
}

module.exports = validateOrders;
