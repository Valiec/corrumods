function onload_debug() {
  console.log('loaded');
  swup.loadPage({url: "https://corru.observer/local/ocean/ship/interview?force"}); //debug, should send you to the interview instead of every other page
}

let doRender = swup.renderPage;
swup.renderPage = function(s, p, o) { console.log("hi I hooked into this"); doRender(s, p, o); }

//addEventListener("animation:out:end", function(a){ console.log("foo") })

onload_debug();


