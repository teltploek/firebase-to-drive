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
const os = require('os');
const fs = require('fs');
const google = require('googleapis');
const key = require('./config.json');
// [END import]

// [START moveToGoogleDrive]
/**
 * When an image is uploaded in the Storage bucket We move it to Google Drive folder
 */
// [START moveToGoogleDriveTrigger]
exports.moveToGoogleDrive = functions.storage.object().onChange(event => {
// [END moveToGoogleDriveTrigger]
  // [START eventAttributes]
  const object = event.data; // The Storage object.

  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
  // [END eventAttributes]

  // [START stopConditions]
  // Exit if this is triggered on a file that is not an image.
  if (!contentType.startsWith('image/')) {
    console.log('This is not an image.');
    return;
  }

  // Get the file name.
  const fileName = path.basename(filePath);

  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/drive'], // an array of auth scopes
    null
  );

  // Exit if this is a move or deletion event.
  if (resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  // Exit if file exists but is not new and is only being triggered
  // because of a metadata change.
  if (resourceState === 'exists' && metageneration > 1) {
    console.log('This is a metadata change event.');
    return;
  }
  // [END stopConditions]

  // [START uploadToDrive]
  // Download file from bucket.
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  return bucket.file(filePath).download({
    destination: tempFilePath
  }).then(() => {
    console.log('Image downloaded locally to', tempFilePath);

    return jwtClient.authorize();
    //return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
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
    
    return drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    });

  })
  .then(() => fs.unlinkSync(tempFilePath))
  .then(() => {
    return bucket.file(filePath).delete();
  });
  // [END uploadToDrive]
});
// [END moveToGoogleDrive]