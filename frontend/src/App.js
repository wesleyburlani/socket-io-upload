import React, { useState } from 'react';
import './App.css';
import { socket } from './socket';
import ss from 'socket.io-stream';
ss.forceBase64 = true;

function App() {
  const [fileToUpload, setFileToUpload] = useState(null);
  const [message, setMessage] = useState('Click Start to transcode');
  
  const onFileChange = async (event) => {
    const file = await event.target.files[0];
    setFileToUpload(file);
  };

  const doUpload = async () => {
    const file = fileToUpload;
    const stream = ss.createStream();
    var blobStream = ss.createBlobReadStream(file);

    let size = 0;
    const totalFileSizeInMbs = file.size / 1024 / 1024;
    blobStream.on('data', function(chunk) { 
      size += chunk.length;
      const sizeInMbs = size / 1024 / 1024;
      setMessage(`${sizeInMbs.toFixed(2)} / ${totalFileSizeInMbs.toFixed(2)} MB (${Math.floor(size / file.size * 100)})%`);
    });

    ss(socket).on('upload.response', (data) => {
      setMessage(`File uploaded to ${data.outputPath}`);
    });
    ss(socket).emit('upload', stream, {name: 'vide.mp4'});
    blobStream.pipe(stream);
  };

  return (
    <div className="App">
      <p/>
      <input type="file" accept="video/*,.mkv,audio/*" onChange={onFileChange} />
      <button onClick={doUpload}>Start</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
