# Specto
This project was made for Spotify Ramp_Up Summer 2020 and is available at https://specto.radjavi.se/. Specto visualizes your music from Spotify using music playback, features and analysis from the Spotify API. The visuals are rendered with [Three.js](https://github.com/mrdoob/three.js/).

> specto - to look at, watch, see. [Latin]

## Details
### Animations
The ball and lights animate to beat and segment changes. 
Beats and segments from the Spotify API are represented as an array of discrete timestamps with a confidence and duration. 
These arrays were used and modified to mimic a waveform using cosine interpolation. 
To make the animations even smoother, a low pass filter cancels out high frequency changes. 

The ball also uses simplex noise to make things more interesting. The size of the noise is based on track tempo, meaning that higher tempo results in wavier movement of the ball.

### Colors
The colors of the scene are chosen based on the energy and valence of the track. 
Higher energy sets warmer colors (red, orange, purple...) and lower energy sets cooler colors (blue, green...). 
Higher valence sets happier, brighter colors (yellow, green, blue) and lower valence sets sadder, darker colors (dark blue, purple, red). 
A combination of these sets the final track color.

### Audio sync
The mimiced waveform is synced with the audio using a timestamp and position from the last state received from the Spotify Playback SDK.
Since it relies on timestamps, the sync might sometimes be a bit off. It often works pretty good. 
Just in case, Specto will periodically fetch a new state while playing to sync with the timestamp and position.
