function onload_debug() {
  console.log('loaded');
  swup.loadPage({url: "https://corru.observer/local/ocean/ship/interview?force"}); //debug, should send you to the interview instead of every other page
}

if(document.readyState == 'complete')
{
  console.log("ready, calling onload_debug()");
  onload_debug();
}
else
{
  console.log("not ready");
  console.log(document.readyState);
}
