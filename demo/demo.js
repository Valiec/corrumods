// ===== GROUNDSMIND.JS DEMO MOD =====

//this mod adds a new memory hole entry for "hi vekoa" to demonstrate adding a custom page

// ===== MOD INIT =====

//register the mod with groundsmind.js, with the mod ID "demo"
demomod = new Mod("demo");

// ===== PAGE KEYS =====

//the presence/absence of a trailing slash or whether spaces are encoded or not does not matter, URLs are normalized into "page keys" internally
//exception: the url can either be entirely encoded or entirely not encoded, encoding some characters but not others will not work
//e.g. "/local/uncosm/hi vekoa" or "/local/uncosm/hi%20vekoa" both work, but "/local/uncosm/hi there%20vekoa" will not
//this should apply in every case a library method takes a url, except the destination (actual) URLs of custom pages


// ===== CUSTOM PAGE REGISTRATION =====

//registering a custom page (not showing hardcoded here because it is very long)
//the fact this adds a page at /local/uncosm/hi%20vekoa also adds it as memory hole code "hi vekoa", as env.uncode has been overridden
//the first argument is the URL the page will be "inserted" at, this is converted into a page key as explained above
//the second argument is the actual URL the page can be found at, this is just a normal url and not a page key
demomod.registerCustomPage("/local/uncosm/hi vekoa", "https://valiec.github.io/corrumods/demo/demo.html");

// ===== ACTOR AND DIALOGUE REGISTRATION =====

//registering Idril as an actor on this page
//forPages URLs are converted into page keys
//if forPages is specified as the string "global" instead of a list, this would be added as a global actor
demomod.registerActor("idril", {
    image: "/img/sprites/obesk/idril/portrait.gif",
    type: "obesk qou portrait-contain",
    voice: ()=>play("talkmind", 0.8),
    player: true
}, forPages=['/local/uncosm/hi vekoa']);

//registering the okidoia as an actor
demomod.registerActor("okidoia", {
    voice: ()=>play('okidoia'),
    expressions: {
        default: {
            voice: ()=>play('okidoia'),
        },
        dark: { 
            type: "mutter",
            voice: ()=>play('scarydoia'),
        },
    }
}, forPages=['/local/uncosm/hi vekoa']);

//registering Cavik as an actor
demomod.registerActor("cavik", {
    image: "/img/sprites/obesk/cavik/portrait.gif",
    type: "obesk qou cavik portrait-contain",
    voice: ()=>play('talk', 1.3)
}, forPages=['/local/uncosm/hi vekoa']);

//register the actual dialogue
//forPages URLs are converted into page keys
//if forPages is specified as the string "global" instead of a list, this would be added as a global dialogue
demomod.registerDialogue("hi-vekoa", `
start
    sys
        NOTICE::'memory stream located'

    idril
        hi vekoa

    okidoia
        ÷mÔ3Ôhií-ÿä›

    idril
        how does this work?

    okidoia
        üáÜOz©ágroundsmind.jseå  **Õ^ ÆÊâ¢=õ¾ÐN

    idril
        what?

    idril
        groundsmind js?

    cavik
        groundsmind.js a work-in-progress modding library for corru.observer
        in its current state, it allows for adding custom pages, 
        either fetched from a remote URL or hardcoded into the mod JS,
        as well as registration of actors and dialogue on a page from JS

    cavik
        it is also capable of detecting some types of mod conflicts involving
        mods using groundsmind.js

    cavik
        this memory stream is demonstrating the library's functionality by
        adding a new page to the game

    cavik
        the page content is fetched from a remote URL, and the game is redirected
        there upon attempting to visit the page or use the memory hole code 'hi vekoa'

    cavik
        requests to the actual corru.observer site for custom pages should only occur
        when directly entering the URL in your browser, when moving from another page
        the use of the custom URL is detected and redirected without hitting the actual site

    cavik
        in addition, these actors and dialogue entries are added from the mod's javascript
        instead of the remote HTML file

    cavik
        examine the source code of groundsmind.js and demo.js for further information

    cavik
        be aware that groundsmind.js is currently in early alpha
        and much is still subject to change at any time

    sys
        NOTICE::'memory stream terminated'

    RESPONSES::sys
        return<+>END
            EXEC::moveTo("/local/depths/")
`, forPages=['/local/uncosm/hi vekoa']);

// ===== HANDLER TO INIT DIALOGUE =====

document.addEventListener('corru_entered', function() {
    if(isOnPage("/local/uncosm/hi vekoa")) //helper function to compare only the relative path of the URL in a standard form
    {
        //due to the way dialogue works, if you register dialogue through JS then want to call it on load,
        //you have to initCurrentPage() here, because otherwise the registered dialogue won't have been added to the page in time
        //and it will try to start dialogue that doesn't exist, since onLoaded() is called immediately on load
        initCurrentPage();
        startDialogue("hi-vekoa");
    }
});