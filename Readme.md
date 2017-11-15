# VideoPress

A Node.js/Electron.io application to process WordCamp Videos, adding an opening and closing and transcoding to the appropriate size and setup, then uploading to WordPress.tv


## Install

If you want to help me code it, you can clone this repo, run 
```
npm install
./go.sh 
```

At some point, I will package this into a proper Electron.io application, so, people can just download it.

## Prerequisits 

This has only been run on Mac OSX.  It, in theory, should work on others, but I havn't tested it.

You will need to install ffmpeg on your computer and make sure its in your path.

On a Mac, you can do:
```
brew install ffmpeg --with-vpx --with-vorbis --with-libvorbis --with-vpx --with-vorbis --with-theora --with-libogg --with-libvorbis --with-gpl --with-version3 --with-nonfree --with-postproc --with-libaacplus --with-libass --with-libcelt --with-libfaac --with-libfdk-aac --with-libfreetype --with-libmp3lame --with-libopencore-amrnb --with-libopencore-amrwb --with-libopenjpeg --with-openssl --with-libopus --with-libschroedinger --with-libspeex --with-libtheora --with-libvo-aacenc --with-libvorbis --with-libvpx --with-libx264 --with-libxvid

```

You will also need a copy of Electron.io, of course.

