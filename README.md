# Audio Visualizer
## About
Audio Vis is an Audio Visualizer that lets you sign in with Spotify to visualize song previews. Unfortunately, at the time of making this application, Spotify's web API only supports grabbing preview links. This web app can be found at https://audiovis.csh.rit.edu.

## Tech Used
Audio Vis uses HTML, HTML Canvas, CSS, Javascript, JQuery, and NodeJS. I also used the Spotify Web API to authenticate users and search for song previews.

## Running Locally
To run this web app locally, start by installing node here: https://nodejs.org/en/.
Then run "npm install" within the directory you've cloned this application.

server.js must be modified on lines 12, 13, and 14 to contain your own
Spotify Web Application's credentials which can be created at
https://beta.developer.spotify.com/dashboard/. You may also want to change
the port your application listens on, located on the last line of server.js.

Any domains you host the application to must also be added in Spotify's developer
dashboard as well. For more information on the Spotify Web API, check out the
documentation found here: https://developer.spotify.com/web-api/

To run this application run "npm start" in the root directory.
