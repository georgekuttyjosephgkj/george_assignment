const express = require('express');
const cors = require('cors')
const path = require('path');
const multer = require('multer');
const validateOrders = require("./modules/validations");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors({origin: '*'}));
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
const uploadStorage = multer({ storage: storage })

// app.post("/uploadFile", uploadStorage.single("filesToBeUploaded"), (req, res) => { //to upload single file
//   return res.send({status:"file uploaded"})
// })

app.post('/uploadFiles', uploadStorage.array("filesToBeUploaded", 10), (req, res) => { //to upload multiple files
  validateOrders(req,res)
})

app.listen(3001, (error) => {
  if (!error)
    console.log("Server is Successfully Running,and App is listening on port " + 3001)
  else
    console.log("Error occurred, server can't start", error);
}
);
