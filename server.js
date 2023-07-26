const express = require('express');
const cors = require('cors')
const path = require('path');
const multer = require('multer');
const validateOrders = require("./modules/validations");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors({ origin: '*' }));
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
function fileFilter(req, file, callback) { //file extension check
  var fileUploadTypes = ["text/csv", "text/xml"];
  var ext = file.mimetype;
  if (!fileUploadTypes.includes(ext)) {
    req.fileValidationError = true;
    callback(null, false);
  }
  callback(null, true)
}
const uploadStorage = multer({ storage: storage, fileFilter: fileFilter })
app.post('/uploadFiles', uploadStorage.array("filesToBeUploaded", 10), (req, res) => { //to upload multiple files
  if (req.fileValidationError == true) {
    res.send({ "status": "failed", "message": "unsupported file Format" });
  } else {
    validateOrders(req, res)
  }
})
app.post('/downloadExcel', (req, res) => { //to download excel file
  res.sendFile(req.body.filePath)
})
app.listen(3001, (error) => {
  if (!error)
    console.log("Server is Successfully Running,and App is listening on port " + 3001)
  else
    console.log("Error occurred, server can't start", error);
}
);
