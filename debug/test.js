function onload_debug() {
  console.log('loaded');
  swup.loadPage({url: "https://corru.observer/local/ocean/ship/interview?force"}); //debug, should send you to the interview instead of every other page
}

function overrideLoad(pageRec, renderOpts)
{
  console.log("hi I hooked into this: pageRec is "+pageRec+", renderOpts are "+renderOpts);
  doRender(pageRec, renderOpts);
}

let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);

onload_debug();


