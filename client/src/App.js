import React, { useState,useRef } from "react";
import axios from 'axios';
import './App.css';

function App() {

  const [files, setFiles] = useState([])
  const [status, setStatus] = useState("")
  const fileRef = useRef()

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
      axios.post('/uploadFiles', formData, { headers: { "Content-Type": "multipart/form-data" } })//to upload files and do validation
        .then((res) => res.data)
        .then((data) => {
          if (data.status == "failed") {
            setStatus("")
            alert(data.message)
          } else if (data.status == "success") {
            downloadExcel(data.filePath)
          }
        })
        .catch((error) => {
          console.log(error);
          setStatus("")
        })
    } else {
      alert("No files selected")
    }
  }

  function downloadExcel(filePath) { //to download created report file
    axios.post('/downloadExcel', { "filePath": filePath }, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'report.xlsx');
        document.body.appendChild(link);
        link.click();
        setStatus("");
        setFiles(()=>{
          fileRef.current.value="";
          return []
        })
        alert("report created successfully")
      })
      .catch((error) => {
        setStatus("")
        console.log(error);
      })
  }

  return (
    <div className="App">
      <div style={{ backgroundColor: "#000", height: 50, color: "#fff", fontSize: 20, display: "flex", alignItems: "center", paddingLeft: 20 }}>
        React-Node POC
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20 }}>
          <input ref={fileRef} name="filesToBeUploaded" type="file" multiple={true} accept='.csv,.xml' onChange={onFileChange} />
        </div>
        <div style={{ padding: 20 }}>
          <button onClick={onFileUpload} disabled={status === "uploading"}>Upload!</button>
        </div>
      </div>
      <div style={{paddingTop:36}}>
        <>
          {[...files].map((f, i) => (
            <div style={{ padding: 5, color: "#976f6f" }} key={i}>{i + 1}){f.name} - {f.type}</div>
          ))}
        </>
      </div>
    </div >
  );
}

export default App;


