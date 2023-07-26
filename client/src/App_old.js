import React, { useState, useEffect } from "react";
import axios from 'axios';
import './App.css';

function App() {

  const [files, setFiles] = useState([])
  const [status, setStatus] = useState("")

  function onFileChange(event) {
    setFiles(event.target.files)
  };

  function onFileUpload() {
    if (files.length) {
      setStatus("uploading")
      var formData = new FormData();
      [...files].forEach((file, i) => {
        formData.append("filesToBeUploaded", file, file.name)
      })
      axios.post('/uploadFiles', formData, { headers: { "Content-Type": "multipart/form-data" }, responseType: 'blob' })
        .then((res) => {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'report.xlsx');
          document.body.appendChild(link);
          link.click();
          setStatus("")
          alert("report created successfully")
        })
        .catch((error) => {
          console.log(error);
          setStatus("")
        })
    } else {
      console.log("No files")
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <input name="filesToBeUploaded" type="file" multiple={true} accept='.csv,.xml' onChange={onFileChange} />
          <button onClick={onFileUpload} disabled={status === "uploading"}>Upload!</button>
          <ol>
            {[...files].map((f, i) => (
              <li key={i}>{f.name} - {f.type}</li>
            ))}
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
