//Setup IIFE
(function(){
    'use strict';

    //IIFE scope variables

    //Audio variables
    var NUM_SAMPLES = 256, audioElement, analyserNode,
    SOUND_1 = 'media/New Adventure Theme.mp3', SOUND_2 = 'media/Peanuts Theme.mp3',
    SOUND_3 = 'media/The Picard Song.mp3';

    //Canvas variables
    var canvas, ctx;
    //Effect varibles
    var cosmicChicken = false, curves = false, glowBoxes = false;
    //Filter Variables
    var threshold = false, threshVal = 0;

    var defaultSongs;
    var addedSongs = [];

    //Spotify Element Variables
    var spSearchButton, spSearchField, spResultsBox, spSearches, spAppendSpan;

    //Video elements
    var videoElement;

    function init(){
      //Setup canvas context variable
      canvas = document.querySelector('canvas');
      ctx = canvas.getContext("2d");

      ctx.canvas.width  = window.innerWidth;
      ctx.canvas.height = window.innerHeight;

      videoElement = document.querySelector('video');

      videoElement.width = 5/6 * window.innerWidth;
      videoElement.height = 5/6 * window.innerHeight;

      //Set variable for audio element
      audioElement = document.querySelector('audio');
      /*
      Google Chrome had trouble requesting songs from the Spotify Preview links.
      After some googling I found this one-line fix
      Source: https://stackoverflow.com/questions/31308679/mediaelementaudiosource-outputs-zeros-due-to-cors-access-restrictions-local-mp3
      */
      audioElement.crossOrigin = "anonymous";

      // Initialize analyser node with helper function
      analyserNode = createWebAudioContextWithAnalyserNode(audioElement);
      setupUI();

      //Init Graphics settings
      document.getElementById('glowboxesBox').checked = glowBoxes = true;

      //Add song name variables to the default songs
      defaultSongs = document.getElementsByClassName("default-song");
      defaultSongs[0].displayName = "New Adventure Theme";
      defaultSongs[1].displayName = "Peanuts Theme";
      defaultSongs[2].displayName = "The Picard Song";

      // load and play default sound into audio element
      var firstOption = document.getElementById("defaultOption");
      //console.dir(defaultSongs[0]);
      playStream( audioElement, defaultSongs[0]);

      //Set Closure-scoped variables for Spotify elements
      spSearchButton = document.getElementById("sp-search-button");
      spSearchField = document.getElementById('sp-search-field');
      spSearchField.oninput = generateSearchResults;
      spResultsBox = document.getElementById('sp-results-box');
      spSearches = document.getElementById('sp-searches');
      spAppendSpan = document.getElementById('sp-append-span');

      window.onresize = resize;

      update();
    }

  function update() {
    // create a new array of 8-bit integers (0-255)
    var data = new Uint8Array(NUM_SAMPLES/2);
    analyserNode.getByteFrequencyData(data);

    //Clear previous frame
    ctx.clearRect(0,0, canvas.offsetWidth, canvas.offsetHeight);

    var barWidth = canvas.offsetWidth  / 64;
    var barSpacing = 1;
    var barHeight = 100;
    var topSpacing = 50;

    ctx.lineWidth = 8;

    if(cosmicChicken)
      drawVideo();

    if(glowBoxes)
    {
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

    //Called for each 0-255 value passed in
    for(var i = 0; i < data.length; i++) {
      ctx.fillStyle = 'rgba(0,255,0,0.6)';

      //ctx.fillRect(i * (barWidth + barSpacing),topSpacing + 256-data[i],barWidth,barHeight);
      //ctx.fillRect(canvas.offsetWidth - i * (barWidth + barSpacing), topSpacing + 256 - data[i] - 20, barWidth, barHeight);

      if(curves && i <= (data.length - 30)) {
        //Custom Drawing Code
        drawCurves(data[i], (data.length - 30), i, 250, "white", 0);
        drawCurves(data[i], (data.length - 30), i, 200, "purple", 0);
      }

      if(glowBoxes)
        drawGlowBoxes(data[i], data.length, i);

    }

    applyFilters();

    // this schedules a call to the update() method in 1/60 seconds
    requestAnimationFrame(update);
  }

    //HELPER FUNCTIONS

    //Called whenever the window is resized
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

  function createWebAudioContextWithAnalyserNode(audioElement) {
    var audioCtx, analyserNode, sourceNode;

    // create new AudioContext
    audioCtx = new (window.AudioContext || window.webkitAudioContext);

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

  function setupUI(){

    //Navbar Dropdowns
    document.querySelector("#tracklist-button").onclick = tlDropdown;
    document.querySelector("#effects-button").onclick = efDropdown;


    document.querySelector("#trackSelect").onchange = function(e){
      playStream(audioElement, e.target);
    };

    document.querySelector("#thSlider").onchange = function(e){
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
    document.getElementById('cosmicChickenBox').onchange = function(e){
      cosmicChicken = e.target.checked;
    };

    //Curves
    document.getElementById('curvesBox').onchange = function(e){
      curves = e.target.checked;
    };

    //Glow Glow Boxes
    document.getElementById('glowboxesBox').onchange = function(e){
      glowBoxes = e.target.checked;
    };

    //Threshold
		document.getElementById('thresholdBox').onchange = function(e){
			threshold = e.target.checked;
		};

  }

  function playStream( audioElement, targ) {
    audioElement.src = targ.value;
    //audioElement.play();
    audioElement.volume = 0.2;

    if(targ.displayName != null)
      document.querySelector('#status').innerHTML = "Now playing: " + targ.displayName;
    else
      document.querySelector('#status').innerHTML = "Now playing: " + targ[targ.selectedIndex].displayName;
  }

  function requestFullscreen( element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullscreen) {
      element.mozRequestFullscreen();
    } else if (element.mozRequestFullScreen) { // camel-cased 'S' was changed to 's' in spec
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
    // .. and do nothing if the method is not supported
  }

  function getRandomColor() {
    var red = Math.round(Math.random()*254+1);
    var green = Math.round(Math.random()*254+1);
    var blue=Math.round(Math.random()*254+1);
    var color='rgb('+red+','+green+','+blue+')';
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
    return (style.display === 'none')
  }

  function tlDropdown() {
    var tlDropdown = document.getElementById("tracklist-dropdown");
    if(isHidden(tlDropdown)){
      tlDropdown.style.display = "initial";
    }
    else
      tlDropdown.style.display = "none";
  }

  function efDropdown() {
    var efDropdown = document.getElementById("effects-dropdown");
    efDropdown.style.height = 60 + (.1 * window.innerHeight) + "px";
    if(isHidden(efDropdown)){
      efDropdown.style.display = "initial";
    }
    else {
      efDropdown.style.display = "none";
    }
  }

  //DRAWING HELPER FUNCTIONS
  function drawCurves(currData, dataLength, dataIndex, radius, stColor, degreeOffset) {
    ctx.save();

    //Variables I can make parameters for later
    var center = { x: canvas.width / 2, y: canvas.height / 2 };
    var radiusCoeff = currData / 256;
    var dcMaxRadius = radiusCoeff * radius;
    var radiansPerInterval = (2 * Math.PI) / dataLength;
  var radianOffset = degreeOffset / 180 * Math.PI;


  //Change the color if the song hits highs or the color has stayed the same for too long
  /*
  if(currData == 250 || colorCounter >= colorTime) {
    bigStrokeColor = getRandomColor();
    smallStrokeColor = getRandomColor();
    colorCounter = 0;
  }
  */

  //Create variables for the radial value of three different angles
  if(dataIndex == 0)
    var prevRad = ((2 * Math.PI) - radiansPerInterval) - (1/16 * Math.PI) + radianOffset;
  else
    var prevRad = (radiansPerInterval * (dataIndex - 1)) - (1/16 * Math.PI) + radianOffset;

  var currRad = (radiansPerInterval * dataIndex) + radianOffset;

  //Set point for further out radian
  if(dataIndex == (dataLength - 1))
    var futureRad = 0 + (1/16 * Math.PI) + radianOffset;
  else
    var futureRad = (radiansPerInterval * (dataIndex + 1)) + (1/16 * Math.PI)  + radianOffset;

    //Find points we need
    var firstCircRadius = 1/4 * dcMaxRadius;
    var secondCircRadius = 1/2 * dcMaxRadius;
    var thirdCircRadius = 3/4 * dcMaxRadius;

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
    ctx.quadraticCurveTo(secondCircPoint.x, secondCircPoint.y, thirdCircPoint.x, thirdCircPoint.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo( firstCircPoint.x, firstCircPoint.y);
    ctx.quadraticCurveTo(thirdCircPoint.x, thirdCircPoint.y, fourthCircPoint.x, fourthCircPoint.y);
    ctx.stroke();

    ctx.restore();
  }

  function drawGlowBoxes( currData, dataLength, dataIndex) {
    var boxMaxHeightPercent = 40;

    var boxHeightPx = canvas.height * (boxMaxHeightPercent / 100);

    var boxWidth = canvas.width / dataLength;
    var boxHeight = (currData / 256) * boxHeightPx;

    var currBoxX = boxWidth * dataIndex;
    var currBoxY = (canvas.height / 2) - boxHeight;

    ctx.save();

    ctx.globalAlpha = .7;

    var glowGradient = ctx.createLinearGradient(0, canvas.height / 2, canvas.width, canvas.height / 2);
    glowGradient.addColorStop(0,"#BA55D3");
    glowGradient.addColorStop(1,"red");

    ctx.fillStyle = glowGradient;

    ctx.fillRect(currBoxX, currBoxY, boxWidth, boxHeight);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#DDA0DD";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "blue";
    ctx.strokeRect(currBoxX, currBoxY, boxWidth, boxHeight);

    ctx.restore();
  }

  //VIDEO ELEMENT HELPER FUNCTIONS

  function drawVideo() {
    ctx.drawImage(videoElement, 0, 0, videoElement.clientWidth, videoElement.clientHeight);
    var imageData = ctx.getImageData( 0, 0, videoElement.clientWidth, videoElement.clientHeight);

    var data = imageData.data;
    var length = data.length;
    var width = imageData.width;

    //Iterates once every 4 pixels to greatly improve performance
    for (var i = 0; i < length; i+= 4) {
      var green = data[i * 4 + 1];
      if (green > 150) {
        data[i * 4 + 3] = 0;
        data[i * 4 + 7] = 0;
        data[i * 4 + 11] = 0;
        data[i * 4 + 15] = 0;
      }

      // invert
      var red = data[i], green = data[i+1], blue = data[i+2];
      data[i] = 255 - red;  		// set red value
      data[i+1] = 255 - green;  		// set blue value
      data[i+2] = 255 - blue;		// set green value
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function applyFilters() {
    var imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var length = data.length;
    var width = imageData.width;

    for (var i = 0; i < length; i += 4) {
      /*
				 if (tintRed) {
				 	// just the red channel this time
				 	data[i] = data[i] + 100;
				 }

				 if(invert) {
				 	var red = data[i], green = data[i+1], blue = data[i+2];
				 	data[i] = 255 - red; //set red value
				 	data[i+1] = 255 - green; //set blue value
				 	data[i+2] = 255 - blue; //set green value
				 	//data[i+3] is the alpha but we’re leaving that alone
				 }

				 //vi) noise
				 if ( noise && Math.random () < .10 ) {
				 	data[i] = data[i+1] = data[i+2] = 128; // graynoise
				 	// data[i] = data[i+1] = data[i+2] = 255; // or whitenoise
				 	// data[i] = data[i+1] = data[i+2] = 0; // or blacknoise
				 	// data[i+3] = 255; //alpha
				 }

				 //vii) draw 2-pixel lines every 50 rows
				 if (lines) {
				 	var row = Math.floor(i/4/width);
				 	if (row % 50 == 0) {
				 		// this row
				 		data[i] = data[i+1] = data[i+2] = data[i+3] = 255;
				 		// next row
				 		data[ i + (width * 4)] = data[ i + ( width * 4) + 1] = data[ i + ( width * 4) + 2] = data [ i + ( width * 4) + 3] = 255;
				 	}
				 }
				 */
				 if (threshold) {
				 	var red = data[i], green = data[i+1], blue = data[i+2];

				 	if(0.2126 * red + 0.7152 * green + 0.0722 * blue >= threshVal)
				 		data[i] = data[i+1] = data[i+2] = 255;
				 	else
				 		data[i] = data[i+1] = data[i+2] = 0;
				 }

			}
			// put the modified data back on the canvas
			ctx.putImageData( imageData, 0, 0);
  }

  //SPOTIFY API CODE

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */

  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if(access_token) {
      console.log("User should be logged in now");
      var loggedOutElements = document.getElementsByClassName("logged-out");
      loggedOutElements[0].style.display = "none";
      var loggedInElements = document.getElementsByClassName("logged-in");
      loggedInElements[0].style.display = "initial";
      loggedInElements[1].style.display = "initial";
    }
    else {
          console.log("User should be logged out now");
          var loggedOutElements = document.getElementsByClassName("logged-out");
          loggedOutElements[0].style.display = "initial";
          var loggedInElements = document.getElementsByClassName("logged-in");
          loggedInElements[0].style.display = "none";
          loggedInElements[1].style.display = "none";
    }
  }

  //My custom Spotify CODE

  var grabSongPreviewLink = function(songCode) {
    var requestLink = 'https://api.spotify.com/v1/tracks/' + songCode;
    $.ajax({
      url: requestLink,
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    }).done(function(data) {

      return data.preview_url;
    });
  }

  var generateSearchResults = function(){
    console.dir("Generate Search Results");

    //Make dropdown visible
    spResultsBox.style.display = "initial";

    //delete old search results

    var searchSection = document.getElementById('sp-searches');
    //Grab every div inside my search section, leaving my text section alone
    var searchSectionItems = searchSection.getElementsByTagName('div');
    //Remove previous search items from the search section
    for(var i = 0; i < searchSectionItems.length; i++) {
        searchSection.removeChild(searchSectionItems[i]);
        i--;
    }

    //Fix search bar height
    spResultsBox.style.height = spSearches.offsetHeight + 20 + "px";

    //Grab Search Query from input field
    var searchQuery = spSearchField.value;

    //Make API call with search query
    if(searchQuery != "")  //Don't search an empty query
    {
      spResultsBox.style.display = "initial";
      songSearch(searchQuery);
    }
    else
      spResultsBox.style.display = "none";

  }

  function songSearch(songQuery) {
    var fixedQuery = "";
    //Replace spaces with + to convert the query to the correct request format
    for(var i = 0; i < songQuery.length; i++)
    {
      if(songQuery[i] == ' ')
        fixedQuery += '+';
      else {
        fixedQuery += songQuery[i];
      }
    }

    var searchLink = 'https://api.spotify.com/v1/search?q=' + songQuery + "&limit=5&type=track";
    $.ajax({
      url: searchLink,
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      success: appendSearchResults
    }).success(function(data) {
      //return data;
    });
  }

  var appendSearchResults = function(results) {
    console.dir(results);
    var songs = results.tracks.items;

    //If there are no results
    if(songs.length == 0) {
      //Create a div element
      var nothingFoundDiv = document.createElement("div");
      var nothingFoundTextNode = document.createTextNode("No songs matching your query.");
      nothingFoundDiv.appendChild(nothingFoundTextNode);

      //Add div to the search box
      nothingFoundDiv.appendAfter(spAppendSpan);
    }

    //For each song returned
    for(var i = songs.length - 1; i >= 0; i--) {
      //Create a div element
      var searchItemElement = document.createElement("div");

      //Create string containing song name and artists
      var currentSong = songs[i];

      var songName = currentSong.name;
      var artists = "";
      for(var j = 0; j < currentSong.artists.length; j++) {
        if(j != (currentSong.artists.length - 1))
          artists += currentSong.artists[j].name + ", ";
        else {
          artists += currentSong.artists[j].name;
        }
      }

      //Create span element and icon element,
      //appendChild the span and icon to the searchItemElement

      //Create search item text element
      var searchItemSpan = document.createElement("span");
      var searchItemText = songName + " by " + artists;
      searchItemSpan.innerHTML = searchItemText;

      var searchItemIcon = document.createElement("div");

      //Add important classes and id
      searchItemIcon.classList.add("add-button");
      var iconId = "song" + i;
      searchItemIcon.id = iconId;

      //Add event handler for adding the searchItem
      searchItemIcon.onclick = addSongHandlerWrapper(currentSong);

      //Append elements
      searchItemElement.appendChild(searchItemSpan);
      searchItemElement.appendChild(searchItemIcon);

      //Add my searchItem class to it for styling
      searchItemElement.classList.add("search-item");

      //Add the search item to the search result area
      searchItemElement.appendAfter(spAppendSpan);
    }

    //Fix search bar height
    spResultsBox.style.height = spSearches.offsetHeight + 20 + "px";
  }

  /**
 * Passing parameters into an event handler's function causes issues
 * because a function with paranthesis will get called on that line.
 * This causes the button's event handler to just return our function's
 * return value when triggered instead of calling our function.
 *
 * To fix this we had to create a wrapper containing our desired parameter
 * and set the return value of our wrapper equal to the function we
 * would like to call
 *
 * This solution is borrowed from my Shape Viewer Exercise and from here
 * /http://2cor214.blogspot.com/2010/08/passing-arguments-to-event-handler-in.html
**/
var addSongHandlerWrapper = function (song) {
  var eventHandler = function()
  {
    addSongToList(song);
  }
  return eventHandler;
}

function addSongToList(song) {

  //Add the song to our Closure variable (addedSongs)
  addedSongs[addedSongs.length] = song;
  //console.dir(addedSongs);

  //Delete all added options elements
  var songList = document.getElementById('trackSelect');

  //Removes all added songs
  for(var i = 0; i < songList.childNodes.length; i++) {
    //If the childNode has a classList and contains the 'added-song' class
    if(songList.childNodes[i].classList != null) {
      if(songList.childNodes[i].classList.contains("added-song"))
      {
        //Delete song option element and iterate backwards
        songList.removeChild(songList.childNodes[i]);
        i--;
      }
    }

  }

  //Create new <option> elements for every added song and append them
  for(var i = 0; i < addedSongs.length; i++) {
    var songOption = document.createElement("option");
    songOption.value = addedSongs[i].preview_url;
    songOption.displayName = addedSongs[i].name;
    songOption.innerHTML = addedSongs[i].name;
    songOption.classList.add("added-song");
    console.dir(songOption);
    songList.appendChild(songOption);
  }
}

  //Call init on window load
  window.addEventListener("load",init);
}());

//Borrowed this function from
// https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
Element.prototype.appendAfter = function (element) {
  element.parentNode.insertBefore(this, element.nextSibling);
},false;
