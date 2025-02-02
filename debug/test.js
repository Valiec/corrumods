function onload_debug() {
  console.log('loaded');
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
