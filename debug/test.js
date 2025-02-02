customPages = {}

function registerCustomPage(fakeURL, realURL)
{
    if(fakeURL.startsWith("https://corru.observer")) //full URL
    {
      customPages[fakeURL] = realURL;
    }
    else if(fakeURL.startsWith("http://corru.observer")) //special case
    {
      customPages[fakeURL.replace("http://", "https://")] = realURL;
    }
    else if(fakeURL.startsWith("/")) //partial URL with leading slash (e.g. "/local/hub")
    {
      customPages["https://corru.observer"+fakeURL] = realURL;
    }
    else //assumed partial URL with no leading slash (e.g. "local/hub")
    {
      customPages["https://corru.observer/"+fakeURL] = realURL;
    }
}

//testing both formats
registerCustomPage("https://corru.observer/local/valiec", "https://corru.observer/local/ozo?force");
registerCustomPage("/local/idril", "https://corru.observer/local/depths?force");

function onload_custompage() {
  if(document.title == "!!__ERROR::UNPROCESSABLE__!!" && window.location.href in customPages) //404 and custom page
  {
    swup.loadPage({url: window.location.href}); //force swup load again to get custom page
  }
}

function overridePageIfNeeded(pageRec)
{
  if(pageRec.title == "!!__ERROR::UNPROCESSABLE__!!" && pageRec.responseURL in customPages) //404 and custom page
  {
    request = new XMLHttpRequest();
    //add hardcoded custom pages here
    request.open("get",customPages[pageRec.responseURL]);
    Object.entries(swup.options["requestHeaders"]).forEach(([key, header]) => {
    	request.setRequestHeader(key, header);
    });
    request.send();
    while(request.readyState < 4) //swup doesn't seem to wait until it's done, so wait here
    {
        //do nothing
    }
    pageRec = swup.getPageData(request);
  }
  return pageRec;
}

function overrideLoad(pageRec, renderOpts)
{
  console.log("hi I hooked into this: pageRec is "+pageRec+", renderOpts are "+renderOpts);
  pageRec = overridePageIfNeeded(pageRec);
  doRender(pageRec, renderOpts);
}

let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);

onload_custompage();


