# Specto
This project was made for Spotify Ramp_Up Summer 2020.

> specto - to look at, watch, see. [Latin]

## About
Specto visualizes your music from Spotify using music playback, features and analysis from the Spotify API. The visuals are rendered with [Three.js](https://github.com/mrdoob/three.js/).

### Animations
The ball and lights animate to beat and segment changes. Beats and segments from the Spotify API are represented as an array of discrete timestamps with a confidence and duration. These arrays were used and modified to mimic a waveform using cosine interpolation. To make the animations smoother, a low pass filter cancels out high frequency changes.

### Colors
The colors of the scene are chosen based on the energy and valence of the track. Higher energy sets warmer colors (red, orange, purple...) and lower energy sets cooler colors (blue, green...). Higher valence sets happier colors (yellow, green, blue) and lower valence sets sadder colors (dark blue, purple, red). 
