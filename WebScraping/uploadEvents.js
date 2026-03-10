require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const path = require('path');


if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
const filePath = path.join(__dirname, 'allEvents.json');
const allEvents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
if(!allEvents.length){
  console.log("No events to upload");
  process.exit(1);
}
console.log(process.env.Upload_API_URL);
axios.post(process.env.Upload_API_URL, allEvents,{
  headers:{
    'X-API-KEY': process.env.UploadEventsKey
  }
})
  .then(res => console.log('✅ Upload success:', res.data))
  .catch(err => {
    console.error('❌ Upload failed');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  });