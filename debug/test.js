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

function overrideUncodeMemhole()
{
    if(window.location.href == "https://corru.observer/local/uncosm/where/") //memhole
    {
        env.uncode["enter"] = ()=>{
                let value = env.uncode.input.value.toLowerCase().replaceAll(".", "").replaceAll("/", "")
                
                if(value.length) {
                    env.uncode.input.blur()
                    cutscene(true)
                    play('destabilize', 0.5)
                    ratween(env.bgm, 0.1)
                    content.classList.add('memorydive')
        
                    if(!check("hub__funfriend-ah1") && value == "recosm") {
                        //fuck you lol
                        location.href = `/img/sprites/obesk/larval/larval7.gif`
                    }

                    let uncosmPath = `https://corru.observer/local/uncosm/${value}/`;
                    if(uncosmPath in customPages)
                    {
                        uncosmPath = customPages[uncosmPath]; //override the page
                    }
                    fetch(uncosmPath).then(resp=>{
                        if(resp.status == 404){
                            cutscene(false)
                            startDialogue('wrong')
                        } else {
                            setTimeout(()=>{
                                cutscene(false)
                                moveTo(uncosmPath)
                            }, 4000)
                        }
                    })
                }
            }
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
    request.open("get",customPages[pageRec.responseURL], false); //synchronous request for now
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
  pageRec = overridePageIfNeeded(pageRec);
  doRender(pageRec, renderOpts);
}

let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);

onload_custompage();
overrideUncodeMemhole();


