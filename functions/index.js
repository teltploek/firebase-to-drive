/**
* Copyright 2016 Google Inc. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for t`he specific language governing permissions and
* limitations under the License.
*/
'use strict';

// [START import]
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const path = require('path');
const spawn = require('child-process-promise').spawn;
const os = require('os');
const fs = require('fs');
const google = require('googleapis');
const key = require('./config.json');
// [END import]

// [START moveToGoogleDrive2]
/**
* When an image is uploaded in the Storage bucket We move it to Google Drive folder
*/
// [START moveToGoogleDrive2Trigger]
exports.moveToGoogleDrive2 = functions.storage.object().onFinalize((object) => {
    // [END moveToGoogleDrive2Trigger]
    // [START eventAttributes]    
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const fileSize = object.size;
    const dontUpload = fileSize < 250000;
    // [END eventAttributes]
    
    // [START stopConditions]
    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        console.log('This is not an image.');
        return;
    }
    // [END stopConditions]
    
    // Get the file name.
    const fileName = path.basename(filePath);
    
    const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/drive'], // an array of auth scopes
        null
    );
    
    // [START uploadToDrive]
    // Download file from bucket.
    const bucket = gcs.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    return bucket.file(filePath).download({
        destination: tempFilePath
    }).then(() => {
        console.log('Image downloaded locally to', tempFilePath);
        // Flip image on the horizontal axis using ImageMagick.
        return spawn('convert', [tempFilePath, '-flop', tempFilePath]);
    }).then(() => {
        return jwtClient.authorize();
    }).then(() => {
        console.log('JWT client authorized');
        
        const drive = google.drive({
            version: 'v3',
            auth: jwtClient
        });
        
        const fileMetadata = {
            name: fileName,
            parents: [key.drive_folder]
        };

        const media = {
            mimeType: 'image/jpeg',
            body: fs.createReadStream(tempFilePath)
        };

        if (dontUpload) {
            console.log('Filesize is too low, only', (fileSize/1000), 'kb... skipping upload.');
        }else{            
            console.log('Trying to upload', fileMetadata, 'to Google Drive...');

            return drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id'
            }, function (err, file) {
                if (err) {
                // Handle error
                console.log('An error occurred when trying to upload file to Google Drive:');
                console.error(err);
                } else {
                console.log('File Id: ', file.id);
                }
            });  
        }  
    })
    .then(() => fs.unlinkSync(tempFilePath))
    .then(() => {
        console.log('Deleting locally downloaded file');
        return bucket.file(filePath).delete();
    });
    // [END uploadToDrive]
});
// [END moveToGoogleDrive2]