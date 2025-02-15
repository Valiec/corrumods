// ===== GROUNDSMIND.JS LIBRARY =====

//groundsmind.js a WIP corru modding library
//it currently supports adding custom pages, either from URLs or hardcoded
//plus registration of actors and dialogue on a page from JS

// ===== EARLY INIT STUFF =====

customPages = {}
modData = {}
pageData = {}
globalActors = {}
globalDialogues = {}

pageInitialized = false;

oldState = document.body.getAttribute("state");
//potentially a custom page, hide the enter button
if(document.title == "!!__ERROR::UNPROCESSABLE__!!" && !env.visitingCustomPage)
{
    document.body.classList.add("cutscene");
    document.body.classList.add("grmHideEnter");
}

// ===== MOD OBJECT RELATED HELPER FUNCTIONS =====

//library method, check save flag for mod
//mostly for cross-mod stuff, use the method on the mod object for most cases

//error logging
function modError(id, msg)
{
    printError(`mod error [${id}]: ${msg}`);
}

//warnings
function modWarn(id, msg)
{
    console.warn(`warning [${id}]: ${msg}`);
}

//info-level logging
function modInfo(id, msg)
{
    console.log(`info [${id}]: ${msg}`);
}

//internal, create pageData[pageKey] if it doesn't exist
function ensurePageDataObject(pageKey)
{
    if(!(pageKey in pageData))
    {
        pageData[pageKey] = {"actors": {}, "dialogues": {}};
    }
}

//check if this object is in this list, unless force is true
//just here to avoid repeated code as this happens a lot
function checkExists(name, obj, force=false)
{
    return (name in obj) && !force;
}

//library method, register dialogue actor for mod
//mostly for cross-mod stuff, use the method on the mod object for most cases
function modRegisterActor(id, name, data, forPages="global", force=false)
{
    if(forPages == "global") //global
    {
        if(!checkExists(name, globalActors, force)) {
            globalActors[name] = {"id": id, "data": data}
        }
        else
        {
            if(globalActors[name]["id"] != id)
            {
                modError(id, `global actor ${name} already registered for mod ${globalActors[name]["id"]}`);
            }
            //if same id, just do nothing
        }
    }
    else //per-page
    {

        forPages.forEach(function(page) {
            let pageKey = urlToKey(page);
            ensurePageDataObject(pageKey);
            if (!checkExists(name, pageData[pageKey]["actors"], force)){
                pageData[pageKey]["actors"][name] = {"id": id, "data": data};
            }
            else
            {
                if(pageData[pageKey]["actors"][name]["id"] != id)
                {
                    modError(id, `actor ${name} already registered for mod ${pageData[pageKey]["actors"][name]["id"]} on page ${pageKey}`);
                }
                //if same id, just do nothing
            }
        });
    }
}

//library method, register dialogue for mod
//mostly for cross-mod stuff, use the method on the mod object for most cases
function modRegisterDialogue(id, name, dialogue, forPages=[], force=false)
{
    if(forPages == "global") //global
    {
        if(!checkExists(name, globalDialogues, force)) {
            globalDialogues[name] = {"id": id, "dialogue": dialogue}
        }
        else
        {
            if(globalDialogues[name]["id"] != id)
            {
                modError(id, `global dialogue ${name} already registered for mod ${globalDialogues[name]["id"]}`);
            }
            //if same id, just do nothing
        }
    }
    else //per-page
    {
        forPages.forEach(function(page) {
            let pageKey = urlToKey(page);
            ensurePageDataObject(pageKey);
            if (!checkExists(name, pageData[pageKey]["dialogues"], force)){
                pageData[pageKey]["dialogues"][name] = {"id": id, "dialogue": dialogue};
            }
            else
            {
                if(pageData[pageKey]["dialogues"][name]["id"] != id)
                {
                    modError(id, `dialogue ${name} already registered for mod ${pageData[pageKey]["dialogues"][name]["id"]} on page ${pageKey}`);
                }
                //if same id, just do nothing
            }
        });
    }
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

// ===== MOD OBJECT AND PROTOTYPE METHODS =====

//mod constructor, call this with the modid
function Mod(id)
{
    this.id = id;
    if(id in modData)
    {
        printError("mod already registered with id '"+id+"'!");
    }
    modData[id] = {"obj": this, "customPages":[]};
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
    if(pageKey in customPages && customPages[pageKey]["modid"] != this.id)
    {
        printError(`mod conflict [${this.id}]: page '${pageKey}' already registered for mod '${customPage[pageKey]["modid"]}'`);
    }
    registerCustomPage(this.id, fakeURL, realURL, force);   
}

//library method, register hardcoded custom page for this mod, errors if another mod already used the URL
Mod.prototype.registerCustomPageHardcoded = function(fakeURL, pageContent, force=false)
{
    let pageKey = urlToKey(fakeURL);
    if(pageKey in customPages && customPages[pageKey]["modid"] != this.id)
    {
        printError(`mod conflict [${this.id}]: page '${pageKey}' already registered for mod '${customPage[pageKey]["modid"]}'`);
    }
    registerCustomPageHardcoded(this.id, fakeURL, pageContent, force);   
}

//library method, register dialogue actor for this mod
Mod.prototype.registerActor = function(name, data, forPages="global", force=false)
{
    return modRegisterActor(this.id, name, data, forPages, force);
}

//library method, register dialogue for this mod
Mod.prototype.registerDialogue = function(name, dialogue, forPages="global", force=false)
{
    return modRegisterDialogue(this.id, name, dialogue, forPages, force);
}

// ===== REGISTRATION HELPER FUNCTIONS =====

//internal, converts a URL to a page key (relative path)
function urlToKey(urlStr)
{
    let url = urlStr;
    if(decodeURI(urlStr) == urlStr)
    {
        url = encodeURI(urlStr);
    }

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

// ===== REGISTRATION LIBRARY FUNCTIONS =====

//library method, registers a custom page
//if fakeURL already registered, do nothing unless force=true
function registerCustomPage(id, fakeURL, realURL, force=false)
{
    let key = urlToKey(fakeURL);

    if(force || !(key in customPages))
    {
        customPages[key] = {"modid": id, "hardcoded": false, "url": realURL};
    }
    return key;
}

//library method, registers a hardcoded custom page (i.e. the page content is in the mod, not a separate file)
//if fakeURL already registered, do nothing unless force=true
function registerCustomPageHardcoded(id, fakeURL, pageContent, force=false)
{
    let key = urlToKey(fakeURL);

    if(force || !(key in customPages))
    {
        customPages[key] = {"modid": id, "hardcoded": true, "hardcodedContent": pageContent};
    }
}

// ===== INTERNAL HELPER FUNCTIONS =====

//internal, overrides env.uncode on the memhole to recognize new codes
function overrideUncodeMemhole()
{
        env.uncode["enter"] = ()=>{
                let value = env.uncode.input.value.toLowerCase().replaceAll(".", "").replaceAll("/", "");
                
                if(value.length) {
                    env.uncode.input.blur();
                    cutscene(true);
                    play('destabilize', 0.5);
                    ratween(env.bgm, 0.1);
                    content.classList.add('memorydive');
        
                    if(!check("hub__funfriend-ah1") && value == "recosm") {
                        //maintain this easter egg
                        location.href = `/img/sprites/obesk/larval/larval7.gif`;
                    }

                    let uncosmPath = `/local/uncosm/${value}/`;
                    let fetchPath = uncosmPath;
                    let pageKey = urlToKey(uncosmPath);
                    let hardcoded = false;
                    if(pageKey in customPages)
                    {
                        if(customPages[pageKey]["hardcoded"])
                        {
                            setTimeout(()=>{
                                cutscene(false);
                                moveTo(uncosmPath);
                            }, 4000);
                            hardcoded = true;
                        }
                        else
                        {
                            fetchPath = customPages[pageKey]["url"]; //override the page
                        }
                    }

                    if(!hardcoded)
                    {
                        fetch(fetchPath).then(resp=>{
                            if(resp.status == 404){
                                cutscene(false);
                                startDialogue('wrong');
                            } else {
                                setTimeout(()=>{
                                    cutscene(false);
                                    moveTo(uncosmPath); //use the original path
                                }, 4000);
                            }
                        });
                    }
                }
            }
}

//internal, force-reload 404 pages if the URL is registered as a custom page
function onloadCustomPage() {
    //if this has the title of the 404 page, is registered as a custom page key, and is *not* itself the result of visiting a custom page
    //the 3rd condition is to prevent reload loops if a custom page is named !!__ERROR::UNPROCESSABLE__!!
    if(document.title == "!!__ERROR::UNPROCESSABLE__!!" && !env.visitingCustomPage)
    {
        if(urlToKey(window.location.href) in customPages)
        {
            moveTo(window.location.href, closeMui=false, quick=true); //force load again to get custom page
        }
        else
        {
            removeGrmHideEnter();
        }
    }
}

//internal, will this "redirect" be cross-origin (most often, is the destination not on corru.observer)
function isCrossOrigin(destURL)
{
    const srcOrigin = new URL(window.location.href).origin;
    const destOrigin = new URL(destURL).origin;
    return srcOrigin != destOrigin;
}

//internal, removes the cutscene class used to hide the enter button
function removeGrmHideEnter()
{
    if(document.body.classList.contains("grmHideEnter"))
    {
        document.body.classList.remove("cutscene");
        document.body.classList.remove("grmHideEnter");
    }
}


//internal, overriding moveTo to handle custom pages
//quick is intended for skipping as much of the page transition as possible for the onload redirect
function moveTo(destUrl, closeMui = true, quick=false){
    pageInitialized = false;
    if(closeMui) {
        MUI("off")
        MUI("deprohibit")
    }
    env.visitingCustomPage = false; //reset this
    const pageKey = urlToKey(destUrl);
    if(pageKey in customPages)
    {
        if(customPages[pageKey]["hardcoded"])
        {
            moveToHardcoded(customPages[pageKey]["hardcodedContent"], destUrl, quick);
        }
        else
        {
            moveToCustom(customPages[pageKey]["url"], destUrl, quick);
        }
    }
    else
    {
        swup.loadPage({url: destUrl})
        removeGrmHideEnter();
    }
    if(body.classList.contains('in-dialogue')) endDialogue()
}

//internal, moveTo helper for custom pages at distinct URLs
function moveToCustom(destUrl, fakeUrl, quick=false){
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
function moveToHardcoded(pageContent, fakeUrl, quick=false){
    env.visitingCustomPage = true;
    let request = {}
    request.responseURL = fakeUrl; //fake the URL
    request.responseText = pageContent;
    let pageRec = swup.getPageData(request);
    fakePageTransition(pageRec, fakeUrl, quick);
    
}

//internal, helper for fakePageTransition
doPageTransition =  function(pageRec, fakeUrl) {
    doRender(pageRec, {});
    history.pushState({}, "", fakeUrl); //override the address bar
    removeGrmHideEnter();
};


//internal, fakes a page transition without actually invoking swup (to avoid spurious requests)
function fakePageTransition(pageRec, fakeUrl, quick=false)
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
    if(customPages[pageKey]["hardcoded"])
    {
        request.responseText = customPages[pageKey]["hardcodedContent"];
    }
    else
    {
        request.open("get",customPages[pageKey]["url"], false); //synchronous request for now
        if(isCrossOrigin(customPages[pageKey]["url"]))
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

function loadDataForKey(pageKey){
    Object.keys(globalActors).forEach(function(actor){
        env.dialogueActors[actor] = globalActors[actor]["data"];
    });
    Object.keys(globalDialogues).forEach(function(dialogue){
        env.dialogues[dialogue] = generateDialogueObject(globalDialogues[dialogue]["dialogue"]);
    });

    if(pageKey in pageData)
    {
        Object.keys(pageData[pageKey]["actors"]).forEach(function(actor){
            env.dialogueActors[actor] = pageData[pageKey]["actors"][actor]["data"];
        });
        Object.keys(pageData[pageKey]["dialogues"]).forEach(function(dialogue){
            env.dialogues[dialogue] = generateDialogueObject(pageData[pageKey]["dialogues"][dialogue]["dialogue"]);
        });
    }
}

//library function, initializes mod data for current page
function initCurrentPage()
{
    if(!pageInitialized)
    {
        let pageKey = urlToKey(window.location.href);
        loadDataForKey(pageKey);
        pageInitialized = true;
    }
}

//library function, checks if the page key or URL passed is the current page
function isOnPage(pageKeyOrUrl)
{
    return urlToKey(window.location.href) == urlToKey(pageKeyOrUrl);
}

// ===== SWUP OVERRIDE AND EVENT LISTENERS =====

//override renderPage in swup
doRender = swup.renderPage.bind(swup);
swup.renderPage = overrideLoad.bind(swup);

document.addEventListener('corru_loaded', function() {
    initCurrentPage();
});

//add uncode replacement handler on memhole textbox focused
document.addEventListener('corru_entered', function() {
    if(isOnPage("/local/uncosm/where")) //memhole
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
