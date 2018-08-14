console.log('hello darkness my old friend')

var providersRequest = new XMLHttpRequest();
providersRequest.open("GET", "http://localhost:3000/providers", true);
providersRequest.send();

providersRequest.onreadystatechange = function() {
	if (providersRequest.readyState === XMLHttpRequest.DONE) {
      if (providersRequest.status === 200) {
      	var div = document.getElementById("providers");
        div.innerHTML += (providersRequest.responseText);
      } else {
        console.error('There was a problem with the request.');
      }
    }
}

var endpointsRequest = new XMLHttpRequest();
endpointsRequest.open("GET", "http://localhost:3000/endpoints", true);
endpointsRequest.send();

endpointsRequest.onreadystatechange = function() {
	if (endpointsRequest.readyState === XMLHttpRequest.DONE) {
      if (endpointsRequest.status === 200) {
      	var div = document.getElementById("endpoints");
        div.innerHTML += (endpointsRequest.responseText);
      } else {
        console.error('There was a problem with the request.');
      }
    }
}
