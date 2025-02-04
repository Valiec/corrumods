//only run this if the arrays don't exist, no need to reset them all the time
if(typeof customPages === 'undefined')
{
    customPages = {}
    customPagesHardcoded = {}
}

function urlToKey(url)
{

    if(url.includes("?")) //if there are params (e.g. "?force")
    {
        url = url.split("?")[0]; //everything before the ?
    }

    if(url.endsWith("/"))
    {
        url = url.slice(0, -1); //remove trailing slash
    }

    if(url == "") //special case, hardcoded page marker
    {
        return url;
    }
    else if(url.startsWith("https://") || url.startsWith("http://")) //full URL
    {
      return new URL(url).pathname; //use URL methods to get pathname
    }
    else if(url.split("/")[0].includes(".")) //first element contains a . (likely domain name)
    {
      return url = new URL("https://"+url).pathname; //use URL methods to get pathname, but prepend HTTPS first
    }
    else if(url.startsWith("/")) //partial URL with leading slash (e.g. "/local/hub")
    {
      return url; //keep as-is
    }
    else //assumed partial URL with no leading slash (e.g. "local/hub")
    {
      return "/"+url; //prepend slash
    }

}

function keyToUrl(key)
{
    return new URL(window.location.href).origin+key;
}

//library method, registers a custom page
function registerCustomPage(fakeURL, realURL, force=false)
{
    let key = urlToKey(fakeURL);

    if(force || !(key in customPages))
    {
        customPages[key] = realURL;
    }
    return key;
}

//library method, registers a hardcoded custom page (i.e. the page content is in the mod, not a separate file)
function registerCustomPageHardcoded(fakeURL, pageContent, force=false)
{
    let key = registerCustomPage(fakeURL, "", force);
    customPagesHardcoded[key] = pageContent;
}


//internal, overrides env.uncode on the memhole to recognize new codes
function overrideUncodeMemhole()
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
                        //maintain this easter egg
                        location.href = `/img/sprites/obesk/larval/larval7.gif`
                    }

                    let uncosmPath = `/local/uncosm/${value}/`;
                    let fetchPath = uncosmPath;
                    if(urlToKey(uncosmPath) in customPages)
                    {
                        fetchPath = customPages[urlToKey(uncosmPath)]; //override the page
                    }
                    fetch(fetchPath).then(resp=>{
                        if(resp.status == 404){
                            cutscene(false)
                            startDialogue('wrong')
                        } else {
                            setTimeout(()=>{
                                cutscene(false)
                                moveTo(uncosmPath) //use the original path
                            }, 4000)
                        }
                    })
                }
            }
}

//force-reload 404 pages if the URL is registered as a custom page
function onload_custompage() {
    //if this has the title of the 404 page, is registered as a custom page key, and is *not* itself the result of visiting a custom page
    //the 3rd condition is to prevent reload loops if a custom page is named !!__ERROR::UNPROCESSABLE__!!
    if(document.title == "!!__ERROR::UNPROCESSABLE__!!" && urlToKey(pageRec.responseURL) in customPages && !env.visitingCustomPage) //404 and custom page
    {
        swup.loadPage({url: window.location.href}); //force swup load again to get custom page
    }
}

function isCrossOrigin(destURL)
{
    const srcOrigin = new URL(window.location.href).origin;
    const destOrigin = new URL(destURL).origin;
    return srcOrigin != destOrigin;
}

function overridePageIfNeeded(pageRec)
{
  if(urlToKey(pageRec.responseURL) in customPages) //custom page
  {
    env.visitingCustomPage = true;
    let request = new XMLHttpRequest();
    let pageKey = urlToKey(pageRec.responseURL);
    if(customPages[pageKey] == "" && pageKey in customPagesHardcoded)
    {
        request.responseText = customPagesHardcoded[pageKey];
    }
    else
    {
        request.open("get",customPages[pageKey], false); //synchronous request for now
        if(isCrossOrigin(customPages[pageKey]))
        {
            request.setRequestHeader("Content-Type", "text/plain"); //make this a "simple request" to stop CORS preflight
        }
        else
        {
            Object.entries(swup.options["requestHeaders"]).forEach(([key, header]) => {
            	request.setRequestHeader(key, header);
            });
        }
        request.send();
    }
    request.responseURL = pageRec.responseURL; //fake the URL
    pageRec = swup.getPageData(request);
  }
  return pageRec;
}

//overriding moveTo
function moveTo(destUrl, closeMui = true){
    if(closeMui) {
        MUI("off")
        MUI("deprohibit")
    }
    env.visitingCustomPage = false; //reset this
    swup.loadPage({url: destUrl})
    if(body.classList.contains('in-dialogue')) endDialogue()
}

function overrideLoad(pageRec, renderOpts)
{
  let url = pageRec.responseURL;
  pageRec = overridePageIfNeeded(pageRec);
  doRender(pageRec, renderOpts);
  history.pushState({}, "", url); //override the address bar
}

let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);


//testing both formats
registerCustomPage("https://corru.observer/local/valiec", "/local/ozo?force");
registerCustomPage("/local/idril", "/local/depths?force");
registerCustomPage("/local/uncosm/silly/", "https://valiec.github.io/corrumods/debug/hivekoa.html");


document.addEventListener('corru_entered', function() {
    console.log("loaded, href is: "+window.location.href);
    if(new URL(window.location.href).pathname == "/local/uncosm/where/") //memhole
    {
        console.log("adding handler");
        let codeElement = document.getElementById('code');
        codeElement.addEventListener('focus', overrideUncodeMemhole);
        console.log("handler added");
    }
});

addEventListener("load", (event) => {
    onload_custompage();
});


