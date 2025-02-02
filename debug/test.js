function onload_debug() {
  console.log('loaded');
  swup.loadPage({url: "https://corru.observer/local/ocean/ship/interview?force"}); //debug, should send you to the interview instead of every other page
}

onload_debug();
