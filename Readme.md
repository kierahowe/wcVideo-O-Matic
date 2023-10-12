# WCVideo-O-Matic

A Node.js/Electron.io application to process WordCamp Videos, adding an opening and closing and transcoding to the appropriate size and setup, then uploading to WordPress.tv

There is a demo for the software at https://youtu.be/FGaDtTmTRus


# Install

If you want to help me code it, you can clone this repo, run 
```
npm install
./go.sh 
```

At some point, I will package this into a proper Electron.io application, so, people can just download it.

## Prerequisits 

This has only been run on Mac OSX.  It, in theory, should work on others, but I havn't tested it.

You will need to install ffmpeg on your computer.  There is a requirement that it comes with --with-libfreetype so we can generate the text over image.  The binaries on the ffmpeg site don't seem to come with that library.   

On A Mac, You can do this...
```
brew install ffmpeg 
```

Not sure what it would be for other OSs, you may need to google that.  You can also build from sources if you are so inclined.


You will also need a copy of Electron.io, of course.  This should get installed with the 'npm install' command and should end up in node_modules/electron/dist/Electron.app/Contents/MacOS/Electron (the go.sh runs this)

# Instructions

This software aims to create the WordCamp videos easily in mass-produced way, where all videos have the same branding and the name and title, but, it doesn't require manual production of each video

At the highest level, the following is the process that would get used for every video from WordCamp...

1. Copy the videos from the cameras to your computer
2. For each video (the process which we are automating with this software)
   1. Open the video in a video editor
   2. Cut off the any non-presentation video from the beginning and the end
   3. Add a title or other intro/exit video to the beginning and end
   4. Export the whole video to a new file
   5. Submit the video, including all presentation details to the WPTV page

### Software instructions

1. Copy the videos from the cameras to your computer
2. Open the software 
3. On the settings page, enter the global config that will be applied to all the videos.
    * Add a url to the for the WordCamp Site, for example: http://2017.toronto.wordcamp.org/   ( this will be where the information about the speakers and presentations are drawn from )
    * Fill in the other details for the settings.
4. Go to Presentations section, for each presentation, select a video, or the checkbox to indicate that there is no video.
    * As you add videos to this section, it will begin transcoding them so they work with the web editor/viewer and so they are prepared for the final video process.
    * As you progress through the rest of the steps, your videos on this page will have various icons beside them indicating their position in the process.   Checkmarks indicate that they have been completed (fully uploaded)
    * You may specify multiple files, and they will be merged together
5. When a video finishes transcoding the "Edit Video" link will appear.  Click on this to specify the start and end of the video.  When you have set the start and end, check of the box indicating that the editing is complete.
6. Once you have completed editing of one or more videos, you can start processing them.  Go to the process page, click on the play button at the top of the screen.   This will create a supporting title and closing page and then merge all three (title, presentation, ending) together and output to a file. 
7. Once you have process one or more files, go to the upload page and press the play button to upload any processed files.



