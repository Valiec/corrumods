//only run this if the arrays don't exist, no need to reset them all the time
if(typeof customPages === 'undefined')
{
    customPages = {}
    customPagesToMods = {}
    customPagesHardcoded = {}
    mods = {}
}

//library method, check save flag for mod
//mostly for cross-mod stuff, use the method on the mod object for most cases
function modCheck(id, inputKey, inputValue = null)
{
    return check(`grmmod_${id}_${inputKey}`, inputValue);
}

//library method, change save flag for mod
//mostly for cross-mod stuff, use the method on the mod object for most cases
function modChange(id, key, value)
{
    return change(`grmmod_${id}_${key}`, value);
}

//mod constructor, call this with the modid
function Mod(id)
{
    this.id = id;
    if(id in mods)
    {
        printError("mod already registered with id '"+id+"'!");
    }
    mods[id] = this;
}

//library method, check save flag for this mod (helper to not have to put in the modid)
Mod.prototype.check = function(inputKey, inputValue = null)
{
    return modCheck(this.id, inputKey, inputValue);
}

//library method, change save flag for this mod (helper to not have to put in the modid)
Mod.prototype.change = function(key, value)
{
    return modChange(this.id, key, value);
}

//library method, register custom page (non-hardcoded) for this mod, errors if another mod already used the URL
Mod.prototype.registerCustomPage = function(fakeURL, realURL, force=false)
{
    let pageKey = urlToKey(fakeURL);
    if(pageKey in customPagesToMods && customPagesToMods[pageKey] != this.id)
    {
        printError(`mod conflict [${this.id}]: page '${pageKey}' already registered for mod '${customPagesToMods[pageKey]}'`);
    }
    customPagesToMods[pageKey] = this.id;
    registerCustomPage(fakeURL, realURL, force);   
}

//library method, register hardcoded custom page for this mod, errors if another mod already used the URL
Mod.prototype.registerCustomPageHardcoded = function(fakeURL, pageContent, force=false)
{
    let pageKey = urlToKey(fakeURL);
    if(pageKey in customPagesToMods && customPagesToMods[pageKey] != this.id)
    {
        printError(`mod conflict [${this.id}]: page '${pageKey}' already registered for mod '${customPagesToMods[pageKey]}'`);
    }
    customPagesToMods[pageKey] = this.id;
    registerCustomPageHardcoded(fakeURL, pageContent, force);   
}

//internal, converts a URL to a page key (relative path)
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

//internal, converts a page key (relative path) to a full URL
function keyToUrl(key)
{
    return new URL(window.location.href).origin+key;
}

//library method, registers a custom page
//if fakeURL already registered, do nothing unless force=true
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
//if fakeURL already registered, do nothing unless force=true
function registerCustomPageHardcoded(fakeURL, pageContent, force=false)
{
    let key = registerCustomPage(fakeURL, "", force); //mapping to empty string = flag for hardcoded page
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

//internal, force-reload 404 pages if the URL is registered as a custom page
function onloadCustomPage() {
    //if this has the title of the 404 page, is registered as a custom page key, and is *not* itself the result of visiting a custom page
    //the 3rd condition is to prevent reload loops if a custom page is named !!__ERROR::UNPROCESSABLE__!!
    if(document.title == "!!__ERROR::UNPROCESSABLE__!!" && urlToKey(window.location.href) in customPages && !env.visitingCustomPage) //404 and custom page
    {
        moveTo(window.location.href, closeMui=false, quick=true); //force load again to get custom page
    }
}

//internal, will this "redirect" be cross-origin (most often, is the destination not on corru.observer)
function isCrossOrigin(destURL)
{
    const srcOrigin = new URL(window.location.href).origin;
    const destOrigin = new URL(destURL).origin;
    return srcOrigin != destOrigin;
}


//internal, overriding moveTo to handle custom pages
//quick is intended for skipping as much of the page transition as possible for the onload redirect
function moveTo(destUrl, closeMui = true, quick=false){
    if(closeMui) {
        MUI("off")
        MUI("deprohibit")
    }
    env.visitingCustomPage = false; //reset this
    const pageKey = urlToKey(destUrl);
    if(pageKey in customPages)
    {
        if(pageKey in customPagesHardcoded)
        {
            moveToHardcoded(customPagesHardcoded[pageKey], destUrl);
        }
        else
        {
            moveToCustom(customPages[pageKey], destUrl);
        }
    }
    else
    {
        swup.loadPage({url: destUrl})
    }
    if(body.classList.contains('in-dialogue')) endDialogue()
}

//internal, moveTo helper for custom pages at distinct URLs
function moveToCustom(destUrl, fakeUrl, quick){
    env.visitingCustomPage = true;
    let request = new XMLHttpRequest();
    let pageKey = urlToKey(fakeUrl);
    request.open("get",destUrl, false); //synchronous request for now
    if(isCrossOrigin(destUrl))
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
    request.responseURL = fakeUrl; //fake the URL
    let pageRec = swup.getPageData(request);
    fakePageTransition(pageRec, fakeUrl, quick);
    
}


//internal, moveTo helper for custom hardcoded (embedded in the JS) pages
function moveToHardcoded(pageContent, fakeUrl, quick){
    env.visitingCustomPage = true;
    let request = {}
    request.responseURL = fakeUrl; //fake the URL
    request.responseText = pageContent;
    let pageRec = swup.getPageData(request);
    fakePageTransition(pageRec, fakeUrl, quick);
    
}

//internal, helper for fakePageTransition
const doPageTransition =  function(pageRec, fakeUrl) {
    doRender(pageRec, {});
    history.pushState({}, "", fakeUrl); //override the address bar
};


//internal, fakes a page transition without actually invoking swup (to avoid spurious requests)
function fakePageTransition(pageRec, fakeUrl, quick)
{

    const transitionCallback = function(event)
    {
        doPageTransition(pageRec, fakeUrl);
        if(!quick)
        {
            removeEventListener("transitionend", transitionCallback);
        }
    };

    page.onLeaving();
    if(!quick)
    {
        addEventListener("transitionend", transitionCallback);
    }
    else
    {
        transitionCallback(null);
    }
}

//internal, helper for overrideLoad
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

//internal, override renderPage
//fallback if something bypasses moveTo somewhere, will generate a spurious request to the original URL
function overrideLoad(pageRec, renderOpts)
{
  let url = pageRec.responseURL;
  pageRec = overridePageIfNeeded(pageRec);
  doRender(pageRec, renderOpts);
  history.pushState({}, "", url); //override the address bar
}


//override renderPage in swup
let doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);


//add uncode replacement handler on memhole textbox focused
document.addEventListener('corru_entered', function() {
    if(new URL(window.location.href).pathname == "/local/uncosm/where/") //memhole
    {
        console.log("adding uncode replacement handler");
        let codeElement = document.getElementById('code');
        codeElement.addEventListener('focus', overrideUncodeMemhole);
    }
});

//onload event to handle going to pages directly
addEventListener("load", (event) => {
    onloadCustomPage();
});
