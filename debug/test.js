function onload_debug() {
  console.log('loaded');
  swup.loadPage({url: "https://corru.observer/local/ocean/ship/interview?force"}); //debug, should send you to the interview instead of every other page
}

function overridePageIfNeeded(pageRec)
{
  if(pageRec.title == "!!__ERROR::UNPROCESSABLE__!!") //404
  {
    request = new XMLHttpRequest();
    request.open("get","https://corru.observer/local/ozo?force"); //different so I can tell which is which
    Object.entries(swup.options["requestHeaders"]).forEach(([key, header]) => {
    	request.setRequestHeader(key, header);
    });
    request.send();
    pageRec = swup.getPageData(request);
  }
  return pageRec;
}

function overrideLoad(pageRec, renderOpts)
{
  console.log("hi I hooked into this: pageRec is "+pageRec+", renderOpts are "+renderOpts);
  pageRec = overridePageIfNeeded();
  doRender(pageRec, renderOpts);
}

let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);

//onload_debug();


