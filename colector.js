// 1. Create the button
var button = document.createElement("button");
button.innerHTML = "UborzzBotón";
button.id = "new-button"

var body = document.getElementsByTagName("header")[0];
body.appendChild(button);

button.addEventListener ("click", function() {
  alert("did something");
});
