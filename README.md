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