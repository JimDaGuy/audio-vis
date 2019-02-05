//Setup IIFE
(function() {
  "use strict";

  //IIFE scope variables

  //Audio variables
  var NUM_SAMPLES = 256,
    audioElement,
    analyserNode,
    SOUND_1 = "media/New Adventure Theme.mp3",
    SOUND_2 = "media/Peanuts Theme.mp3",
    SOUND_3 = "media/The Picard Song.mp3";

  //Canvas variables
  var canvas, ctx;
  //Effect varibles
  var cosmicChicken = false,
    curves = false,
    glowBoxes = false,
    triCirc = false,
    circles = false,
    audioLine = false,
    bezier = false;

  var glowBallTimer = 0;

  var triCircRadius, triCircRadiusPerc;

  //Filter Variables
  var threshold = false,
    tcWaveHeight = 50,
    threshVal = 0,
    tintRed = false,
    noise = false;

  var defaultSongs;
  var addedSongs = [];

  //Spotify Element Variables
  var spSearchButton, spSearchField, spResultsBox, spSearches, spAppendSpan;

  //Video elements
  var videoElement;

  //Init Function - Sets up all initial variables for the visualizer
  function init() {
    //Setup canvas context variable
    canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");

    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    //Tri circ radius elements
    triCircRadiusPerc = 30;
    triCircRadius = canvas.height * (triCircRadiusPerc / 100);

    videoElement = document.querySelector("video");

    videoElement.width = (5 / 6) * window.innerWidth;
    videoElement.height = (5 / 6) * window.innerHeight;

    setupUI();

    //Init Graphics settings
    document.getElementById("glowboxesBox").checked = glowBoxes = true;
    document.getElementById("tricircBox").checked = triCirc = true;

    //Add song name variables to the default songs
    defaultSongs = document.getElementsByClassName("default-song");
    defaultSongs[0].displayName = "New Adventure Theme";
    defaultSongs[1].displayName = "Peanuts Theme";
    defaultSongs[2].displayName = "The Picard Song";

    //Set Closure-scoped variables for Spotify elements
    spSearchButton = document.getElementById("sp-search-button");
    spSearchField = document.getElementById("sp-search-field");
    spSearchField.oninput = generateSearchResults;
    spResultsBox = document.getElementById("sp-results-box");
    spSearches = document.getElementById("sp-searches");
    spAppendSpan = document.getElementById("sp-append-span");

    window.onresize = resize;
  }

  function initAudio() {
    //Set variable for audio element
    audioElement = document.querySelector("audio");
    /*
      Google Chrome had trouble requesting songs from the Spotify Preview links.
      After some googling I found this one-line fix
      Source: https://stackoverflow.com/questions/31308679/mediaelementaudiosource-outputs-zeros-due-to-cors-access-restrictions-local-mp3
      */
    audioElement.crossOrigin = "anonymous";

    // Initialize analyser node with helper function
    analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
    // load and play default sound into audio element
    playStream(audioElement, defaultSongs[0]);

    update();
  }

  //Update Function - Grabs song data and updates the visualizer display each frame
  function update() {
    // create a new array of 8-bit integers (0-255)
    var data = new Uint8Array(NUM_SAMPLES / 2);
    var data2 = new Uint8Array(NUM_SAMPLES / 2);

    //Data 1 is frequency data
    analyserNode.getByteFrequencyData(data);
    //Data 2 is waveform data
    analyserNode.getByteTimeDomainData(data2);

    //Clear previous frame
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    ctx.lineWidth = 8;

    if (cosmicChicken) drawVideo();

    if (glowBoxes) {
      ctx.save();

      ctx.lineWidth = 5;
      ctx.strokeStyle = "#DDA0DD";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#EE82EE";

      //Draw glow boxes base line
      ctx.beginPath();
      ctx.moveTo(0, canvas.offsetHeight / 2);
      ctx.lineTo(canvas.offsetWidth, canvas.offsetHeight / 2);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    if (triCirc) {
      ctx.save();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "white";
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#FF832B";

      //Draw base Circle
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        triCircRadius,
        0,
        2 * Math.PI,
        false
      );
      ctx.closePath();
      ctx.stroke();

      ctx.restore();
    }

    if (audioLine) {
      drawAudioLine(data);
      //glowBallTimer++;
    }

    //Called for each 0-255 value passed in
    for (var i = 0; i < data.length; i++) {
      ctx.fillStyle = "rgba(0,255,0,0.6)";

      if (curves && i <= data.length - 30) {
        //Custom Drawing Code
        drawCurves(data[i], data.length - 30, i, 250, "white", 0);
        drawCurves(data[i], data.length - 30, i, 200, "purple", 0);
      }

      if (glowBoxes) drawGlowBoxes(data[i], data.length, i);

      if (triCirc && i % 2 == 0) drawTriCirc(data2[i], data.length / 2, i / 2);

      if (circles) drawCircles(data[i], data.length, i);

      if (bezier) drawBezierCurves(data[i], data.length, i);
    }

    applyFilters();

    // this schedules a call to the update() method in 1/60 seconds
    requestAnimationFrame(update);
  }

  //HELPER FUNCTIONS

  //Resize function - Resizes the canvas - called whenever the window is resized
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  //Sets up audio analyser node
  function createWebAudioContextWithAnalyserNode(audioElement) {
    var audioCtx, analyserNode, sourceNode;

    // create new AudioContext
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // create an analyser node
    analyserNode = audioCtx.createAnalyser();

    // fft stands for Fast Fourier Transform
    analyserNode.fftSize = NUM_SAMPLES;

    // this is where we hook up the <audio> element to the analyserNode
    sourceNode = audioCtx.createMediaElementSource(audioElement);

    sourceNode.connect(analyserNode);

    // here we connect to the destination i.e. speakers
    analyserNode.connect(audioCtx.destination);
    return analyserNode;
  }

  //Adds proper on click and onchange values to our ui elements
  function setupUI() {
    //Navbar Dropdowns
    document.querySelector("#tracklist-button").onclick = tlDropdown;
    document.querySelector("#effects-button").onclick = efDropdown;

    document.querySelector("#trackSelect").onchange = function(e) {
      playStream(audioElement, e.target);
    };

    document.querySelector("#tcSlider").onchange = function(e) {
      document.querySelector("#tcSliderResults").innerHTML = e.target.value;
      tcWaveHeight = e.target.value;
    };

    document.querySelector("#thSlider").onchange = function(e) {
      document.querySelector("#thSliderResults").innerHTML = e.target.value;
      threshVal = e.target.value;
    };

    /*
    document.querySelector("#fsButton").onclick = function(){
      requestFullscreen(canvas);
    };
    */

    //Sliders and Checkboxes

    //Cosmic Chicken
    document.getElementById("cosmicChickenBox").onchange = function(e) {
      cosmicChicken = e.target.checked;
    };

    //Curves
    document.getElementById("curvesBox").onchange = function(e) {
      curves = e.target.checked;
    };

    //Glow Boxes
    document.getElementById("glowboxesBox").onchange = function(e) {
      glowBoxes = e.target.checked;
    };

    //Triangles Circle
    document.getElementById("tricircBox").onchange = function(e) {
      triCirc = e.target.checked;
    };

    //Audio Line
    document.getElementById("audiolineBox").onchange = function(e) {
      audioLine = e.target.checked;
    };

    //Bezier Curvers
    document.getElementById("bezierBox").onchange = function(e) {
      bezier = e.target.checked;
    };

    //Circles
    document.getElementById("circlesBox").onchange = function(e) {
      circles = e.target.checked;
    };

    //Threshold
    document.getElementById("thresholdBox").onchange = function(e) {
      threshold = e.target.checked;
    };

    //Tint Red
    document.getElementById("redtintBox").onchange = function(e) {
      tintRed = e.target.checked;
    };

    //Noise
    document.getElementById("noiseBox").onchange = function(e) {
      noise = e.target.checked;
    };
  }

  //Play's the selected song
  function playStream(audioElement, targ) {
    audioElement.src = targ.value;
    audioElement.play();
    audioElement.volume = 0.2;

    if (targ.displayName != null)
      document.querySelector("#status").innerHTML =
        "Now playing: " + targ.displayName;
    else
      document.querySelector("#status").innerHTML =
        "Now playing: " + targ[targ.selectedIndex].displayName;
  }

  //Sets canvas to fullscreen
  function requestFullscreen(element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullscreen) {
      element.mozRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      // camel-cased 'S' was changed to 's' in spec
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
    // .. and do nothing if the method is not supported
  }

  //Returns a random color
  function getRandomColor() {
    var red = Math.round(Math.random() * 254 + 1);
    var green = Math.round(Math.random() * 254 + 1);
    var blue = Math.round(Math.random() * 254 + 1);
    var color = "rgb(" + red + "," + green + "," + blue + ")";
    //	var color='rgba('+red+','+green+','+blue+',0.50)'; // 0.50 alpha
    return color;
  }

  /*
Borrowed this short function to determine if an element is displayed or nothing
Used for my dropdown buttons
Found here:
https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
*/
  function isHidden(el) {
    var style = window.getComputedStyle(el);
    return style.display === "none";
  }

  //Checks if the tracklist dropdown is visible
  function tlDropdown() {
    var tlDropdown = document.getElementById("tracklist-dropdown");
    if (isHidden(tlDropdown)) {
      tlDropdown.style.display = "initial";
    } else tlDropdown.style.display = "none";
  }

  //Checks if the effects dropdown is visible
  function efDropdown() {
    var efDropdown = document.getElementById("effects-dropdown");
    efDropdown.style.height = 60 + 0.1 * window.innerHeight + "px";
    if (isHidden(efDropdown)) {
      efDropdown.style.display = "initial";
    } else {
      efDropdown.style.display = "none";
    }
  }

  //DRAWING HELPER FUNCTIONS
  //Draws quadratic curves in a circle around the center of the canvas
  function drawCurves(
    currData,
    dataLength,
    dataIndex,
    radius,
    stColor,
    degreeOffset
  ) {
    ctx.save();

    //Variables I can make parameters for later
    var center = { x: canvas.width / 2, y: canvas.height / 2 };
    var radiusCoeff = currData / 256;
    var dcMaxRadius = radiusCoeff * radius;
    var radiansPerInterval = (2 * Math.PI) / dataLength;
    var radianOffset = (degreeOffset / 180) * Math.PI;

    //Create variables for the radial value of three different angles
    if (dataIndex == 0)
      var prevRad =
        2 * Math.PI - radiansPerInterval - (1 / 16) * Math.PI + radianOffset;
    else
      var prevRad =
        radiansPerInterval * (dataIndex - 1) -
        (1 / 16) * Math.PI +
        radianOffset;

    var currRad = radiansPerInterval * dataIndex + radianOffset;

    //Set point for further out radian
    if (dataIndex == dataLength - 1)
      var futureRad = 0 + (1 / 16) * Math.PI + radianOffset;
    else
      var futureRad =
        radiansPerInterval * (dataIndex + 1) +
        (1 / 16) * Math.PI +
        radianOffset;

    //Find points we need
    var firstCircRadius = (1 / 4) * dcMaxRadius;
    var secondCircRadius = (1 / 2) * dcMaxRadius;
    var thirdCircRadius = (3 / 4) * dcMaxRadius;

    var firstCircPoint = {};
    firstCircPoint.x = center.x + firstCircRadius * Math.cos(currRad);
    firstCircPoint.y = center.y - firstCircRadius * Math.sin(currRad);

    var secondCircPoint = {};
    secondCircPoint.x = center.x + secondCircRadius * Math.cos(prevRad);
    secondCircPoint.y = center.y - secondCircRadius * Math.sin(prevRad);

    var thirdCircPoint = {};
    thirdCircPoint.x = center.x + thirdCircRadius * Math.cos(currRad);
    thirdCircPoint.y = center.y - thirdCircRadius * Math.sin(currRad);

    var fourthCircPoint = {};
    fourthCircPoint.x = center.x + dcMaxRadius * Math.cos(prevRad);
    fourthCircPoint.y = center.y - dcMaxRadius * Math.sin(prevRad);

    ctx.strokeStyle = stColor;
    //Draw quadratic curves
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.quadraticCurveTo(
      secondCircPoint.x,
      secondCircPoint.y,
      thirdCircPoint.x,
      thirdCircPoint.y
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(firstCircPoint.x, firstCircPoint.y);
    ctx.quadraticCurveTo(
      thirdCircPoint.x,
      thirdCircPoint.y,
      fourthCircPoint.x,
      fourthCircPoint.y
    );
    ctx.stroke();

    ctx.restore();
  }

  //Draws several rectangles at the height of their corresponding
  //frequency data
  function drawGlowBoxes(currData, dataLength, dataIndex) {
    var boxMaxHeightPercent = 40;

    var boxHeightPx = canvas.height * (boxMaxHeightPercent / 100);

    var boxWidth = canvas.width / dataLength;
    var boxHeight = (currData / 256) * boxHeightPx;

    var currBoxX = boxWidth * dataIndex;
    var currBoxY = canvas.height / 2 - boxHeight;

    ctx.save();

    ctx.globalAlpha = 0.7;

    var glowGradient = ctx.createLinearGradient(
      0,
      canvas.height / 2,
      canvas.width,
      canvas.height / 2
    );
    glowGradient.addColorStop(0, "#BA55D3");
    glowGradient.addColorStop(1, "red");

    ctx.fillStyle = glowGradient;

    ctx.fillRect(currBoxX, currBoxY, boxWidth, boxHeight);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#DDA0DD";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "blue";
    ctx.strokeRect(currBoxX, currBoxY, boxWidth, boxHeight);

    ctx.restore();
  }

  //Draws triangular looking waves around a circle
  //Their height can be modified in the app
  function drawTriCirc(currData, dataLength, dataIndex) {
    ctx.save();

    var radPerAngle = (2 * Math.PI) / dataLength;
    var currRad = radPerAngle * dataIndex;
    var midRad = radPerAngle * (dataIndex + 0.5);
    var nextRad;
    if (dataIndex == dataLength - 1) nextRad = 0;
    else nextRad = radPerAngle * (dataIndex + 1);

    var radiusOffset = tcWaveHeight * ((currData - 125) / 15);
    var triRadius = triCircRadius + radiusOffset;

    var originX = canvas.width / 2;
    var originY = canvas.height / 2;

    var triPointX = originX + triRadius * Math.cos(2 * Math.PI - midRad);
    var triPointY = originY - triRadius * Math.sin(2 * Math.PI - midRad);

    var currRadX = originX + triCircRadius * Math.cos(currRad);
    var currRadY = originY + triCircRadius * Math.sin(currRad);

    var nextRadX = originX + triCircRadius * Math.cos(nextRad);
    var nextRadY = originY + triCircRadius * Math.sin(nextRad);

    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.fillStyle = "#2C237F";
    ctx.strokeStyle = "#2C237F";
    ctx.shadowColor = "#61C5FF";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(currRadX, currRadY);
    ctx.quadraticCurveTo(triPointX, triPointY, nextRadX, nextRadY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  //Draws rainbow circles and changes their opacity
  //depending on their frequency data values
  function drawCircles(currData, dataLength, dataIndex) {
    if (currData > 128) {
      ctx.save();
      var originX = canvas.width / 2;
      var originY = canvas.height / 2;

      ctx.lineWidth = 5;
      ctx.globalAlpha = (currData - 128) / 128;
      var rainbow = ctx.createRadialGradient(
        originX,
        originY,
        30,
        originX,
        originY,
        200
      );
      rainbow.addColorStop(0, "violet");
      rainbow.addColorStop(0.15, "indigo");
      rainbow.addColorStop(0.3, "blue");
      rainbow.addColorStop(0.45, "green");
      rainbow.addColorStop(0.6, "yellow");
      rainbow.addColorStop(0.75, "orange");
      rainbow.addColorStop(1, "red");
      ctx.strokeStyle = rainbow;

      var drawnCircleRadius = 3 * dataIndex;

      ctx.beginPath();
      ctx.arc(originX, originY, drawnCircleRadius, 0, 2 * Math.PI, false);
      ctx.stroke();

      ctx.restore();
    }
  }

  //Draws a line matching with the height of the audio data
  function drawAudioLine(currData) {
    //I'll come back to this some other time
    /*
    var glowBallTimerMax = 4 * data.length;
    if(glowBallTimer >= glowBallTimerMax)
      glowBallTimer = 1;
    //Find location for glow ball
    var currGbIndex = Math.floor((glowBallTimer / glowBallTimerMax) * (data.length - 1)
    var currentGbX = canvas.width * (glowBallTimer / glowBallTimerMax);
    var currSlope = data[currGbIndex + 1] - data[currGbIndex] / (canvas.width / data.length);
    var currSlopeHeight = data[currGbIndex + 1] - data[currGbIndex] / (canvas.width / data.length);
    var currentGbY = data[currGbIndex] + (currSlope * (currentGbIndex / data.length * canvas.width));
    */
    ctx.save();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "violet";

    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2 - currData[0]);
    for (var i = 1; i < currData.length; i++) {
      ctx.lineTo(
        (canvas.width / currData.length) * i,
        canvas.height / 2 - currData[i]
      );
    }
    ctx.stroke();
    ctx.closePath();

    ctx.restore();
  }

  //Draws bezier curves using frequency data for control points
  function drawBezierCurves(currData, dataLength, dataIndex) {
    ctx.save();

    var firstPointX = (dataIndex / dataLength - 1) * (canvas.width / 2);
    var firstPointY = canvas.height / 2;
    var lastPointX = canvas.width - firstPointX;
    var lastPointY = canvas.height / 2;
    var cp1X = firstPointX;
    var cp1Y = firstPointY + currData * 3;
    var cp2X = lastPointX;
    var cp2Y = lastPointY - currData * 3;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#61FF88";

    ctx.beginPath();

    ctx.moveTo(firstPointX, firstPointY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, lastPointX, lastPointY);

    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }

  //VIDEO ELEMENT HELPER FUNCTIONS

  //Draws our video to the canvas, chroma key's it,
  // and inverts and colors that weren't chroma keyed
  function drawVideo() {
    ctx.drawImage(
      videoElement,
      0,
      0,
      videoElement.clientWidth,
      videoElement.clientHeight
    );
    var imageData = ctx.getImageData(
      0,
      0,
      videoElement.clientWidth,
      videoElement.clientHeight
    );

    var data = imageData.data;
    var length = data.length;
    var width = imageData.width;

    //Iterates once every 4 pixels to greatly improve performance
    for (var i = 0; i < length; i += 4) {
      var green = data[i * 4 + 1];
      if (green > 150) {
        data[i * 4 + 3] = 0;
        data[i * 4 + 7] = 0;
        data[i * 4 + 11] = 0;
        data[i * 4 + 15] = 0;
      }

      // invert
      var red = data[i],
        green = data[i + 1],
        blue = data[i + 2];
      data[i] = 255 - red; // set red value
      data[i + 1] = 255 - green; // set blue value
      data[i + 2] = 255 - blue; // set green value
    }

    ctx.putImageData(imageData, 0, 0);
  }

  //Applies any filter effects that were selected to the canvas
  function applyFilters() {
    if (threshold || tintRed || noise) {
      var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = imageData.data;
      var length = data.length;
      var width = imageData.width;

      for (var i = 0; i < length; i += 4) {
        if (tintRed) {
          data[i] = data[i] + 100;
        }

        if (noise && Math.random() < 0.1) {
          data[i] = data[i + 1] = data[i + 2] = 128; // graynoise
        }

        if (threshold) {
          var red = data[i],
            green = data[i + 1],
            blue = data[i + 2];

          if (0.2126 * red + 0.7152 * green + 0.0722 * blue >= threshVal)
            data[i] = data[i + 1] = data[i + 2] = 255;
          else data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
      // put the modified data back on the canvas
      ctx.putImageData(imageData, 0, 0);
    }
  }

  //SPOTIFY API CODE

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */

  function getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();

  var access_token = params.access_token,
    refresh_token = params.refresh_token,
    error = params.error;

  if (error) {
    alert("There was an error during the authentication");
  } else {
    if (access_token) {
      //console.log("User should be logged in now");
      var loggedOutElements = document.getElementsByClassName("logged-out");
      loggedOutElements[0].style.display = "none";
      var loggedInElements = document.getElementsByClassName("logged-in");
      loggedInElements[0].style.display = "initial";
      loggedInElements[1].style.display = "initial";
    } else {
      //console.log("User should be logged out now");
      var loggedOutElements = document.getElementsByClassName("logged-out");
      loggedOutElements[0].style.display = "initial";
      var loggedInElements = document.getElementsByClassName("logged-in");
      loggedInElements[0].style.display = "none";
      loggedInElements[1].style.display = "none";
    }
  }

  //Deletes previous search results and calls songSearch() with a query
  //that the user has entered in the search field
  var generateSearchResults = function() {
    spResultsBox.style.display = "initial";

    //delete old search results
    var searchSection = document.getElementById("sp-searches");
    var searchSectionItems = searchSection.getElementsByTagName("div");
    for (var i = 0; i < searchSectionItems.length; i++) {
      searchSection.removeChild(searchSectionItems[i]);
      i--;
    }

    spResultsBox.style.height = spSearches.offsetHeight + 20 + "px";

    var searchQuery = spSearchField.value;

    //Make API call with search query
    if (searchQuery != "") {
      spResultsBox.style.display = "initial";
      songSearch(searchQuery);
    } else spResultsBox.style.display = "none";
  };

  //Makes an API call with the given search query, calls
  //appendSearchResults() with the result of the search
  function songSearch(songQuery) {
    var fixedQuery = "";
    //Replace spaces with + to convert the query to the correct request format
    for (var i = 0; i < songQuery.length; i++) {
      if (songQuery[i] == " ") fixedQuery += "+";
      else {
        fixedQuery += songQuery[i];
      }
    }

    var searchLink =
      "https://api.spotify.com/v1/search?q=" +
      songQuery +
      "&limit=5&type=track";
    $.ajax({
      url: searchLink,
      headers: {
        Authorization: "Bearer " + access_token
      },
      success: appendSearchResults
    });
  }

  //Takes the search results, creates elements for them,
  //and adds them to the search box
  var appendSearchResults = function(results) {
    var songs = results.tracks.items;
    for (var i = 0; i < songs.length; i++) {
      if (songs[i].preview_url == null) songs.splice(i, 1);
    }

    //If there are no results
    if (songs.length == 0) {
      var nothingFoundDiv = document.createElement("div");
      var nothingFoundTextNode = document.createTextNode(
        "No songs matching your query."
      );
      nothingFoundDiv.appendChild(nothingFoundTextNode);

      nothingFoundDiv.appendAfter(spAppendSpan);
    }

    // Create elements for the songs returned
    for (var i = songs.length - 1; i >= 0; i--) {
      var searchItemElement = document.createElement("div");

      var currentSong = songs[i];

      var songName = currentSong.name;
      var artists = "";
      for (var j = 0; j < currentSong.artists.length; j++) {
        if (j != currentSong.artists.length - 1)
          artists += currentSong.artists[j].name + ", ";
        else {
          artists += currentSong.artists[j].name;
        }
      }

      var searchItemSpan = document.createElement("span");
      var searchItemText = songName + " by " + artists;
      searchItemSpan.innerHTML = searchItemText;

      var searchItemIcon = document.createElement("div");

      searchItemIcon.classList.add("add-button");
      var iconId = "song" + i;
      searchItemIcon.id = iconId;
      searchItemIcon.innerHTML = "Add Song";

      searchItemIcon.onclick = addSongHandlerWrapper(currentSong);

      searchItemElement.appendChild(searchItemSpan);
      searchItemElement.appendChild(searchItemIcon);

      searchItemElement.classList.add("search-item");

      searchItemElement.appendAfter(spAppendSpan);
    }

    spResultsBox.style.height = spSearches.offsetHeight + 20 + "px";
  };

  var addSongHandlerWrapper = function(song) {
    var eventHandler = function() {
      addSongToList(song);
    };
    return eventHandler;
  };

  //Adds a song to the tracklist so the user can select it
  function addSongToList(song) {
    //Add the song to our Closure variable (addedSongs)
    addedSongs[addedSongs.length] = song;

    //Delete all added options elements
    var songList = document.getElementById("trackSelect");

    //Removes all added songs
    for (var i = 0; i < songList.childNodes.length; i++) {
      //If the childNode has a classList and contains the 'added-song' class
      if (songList.childNodes[i].classList != null) {
        if (songList.childNodes[i].classList.contains("added-song")) {
          //Delete song option element and iterate backwards
          songList.removeChild(songList.childNodes[i]);
          i--;
        }
      }
    }

    //Create new <option> elements for every added song and append them
    for (var i = 0; i < addedSongs.length; i++) {
      var songOption = document.createElement("option");
      songOption.value = addedSongs[i].preview_url;
      songOption.displayName = addedSongs[i].name;
      songOption.innerHTML = addedSongs[i].name;
      songOption.classList.add("added-song");
      songList.appendChild(songOption);
    }
  }

  window.addEventListener("load", init);
  window.addEventListener("click", initAudio);
})();

(Element.prototype.appendAfter = function(element) {
  element.parentNode.insertBefore(this, element.nextSibling);
}),
  false;
