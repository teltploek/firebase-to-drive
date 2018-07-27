firebase-to-drive
---

This is a Firebase function to be installed on a Firebase project.

When installed it will watch the storage on a project, and once a file arrives, it will move it to a Google Drive (configured in config.json).

You cannot use this out of the box without previously having made a Google Cloud Platform project and assigned the neccessary credentials for the role that will handle the upload on Google Drive.

I use this for my Raspberry Pi timelapse project. Because of storage limitations I need to move files from Firebase to Drive (where I have a lot of space) and then delete the file from Firebase in the end.

### Deployment

To deploy to Firebase, simply:

```
firebase deploy
```

### Sorting out credentials for Google Drive (on Google Cloud Platform)

You'll need to create a project on Google Cloud Platform to be able to grant permission for a service account to access your Google Drive.

Go to https://console.cloud.google.com/ and set up a service account.

### Setting up config.json

Once you've created a service account on Google Cloud Platform you need to pass the credentials on to this project. You can do so by creating a key on the Google Cloud Platform console under `Service Accounts`. The JSON-file downloaded should be stored as a `config.json` file inside the `functions` directory of this project. As an addition to this `config.json` file you should add another key inside the root object, with the name of `drive_folder` and the value being the Google Drive folder id for which you want to store the images. The id of a Google Drive folder is shown in the browser address bar `https://drive.google.com/drive/u/1/folders/{Google Drive Folder Id}`.

The `functions/config.json` should have the following model:

```json
{
  "type": "service_account",
  "project_id": "{Google Cloud Platform project id}",
  "private_key_id": "{Private key id}",
  "private_key": "{Private key payload}",
  "client_id": "{Client id of the service id client from Google Cloud Platform}",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/{Google Cloud Platform Service Account Address}",
  "drive_folder": "{Google Drive Folder Id}"
}
```


