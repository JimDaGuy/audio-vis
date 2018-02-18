# Audio Visualizer
## About
This web app can be found at https://audiovis.csh.rit.edu.

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

To run this application run "npm start" (CTRL + C to close the server when you're done).
