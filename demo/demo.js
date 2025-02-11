//MOD INIT

//register the mod with groundsmind.js, with the mod ID "demo"
demomod = new Mod("demo");

//CUSTOM PAGE

//registering a custom page (not showing hardcoded here because it is very long)
//the fact this adds a page at /local/uncosm/hivekoa also adds it as memory hole code "hi vekoa", as env.uncode has been overridden
//the presence/absence of a trailing slash or whether spaces are encoded or not does not matter, these are normalized into "page keys" internally
//exception: the url can either be entirely encoded or entirely not encoded, encoding some characters but not others will not work
demomod.registerCustomPage("/local/uncosm/hi vekoa/", "https://valiec.github.io/corrumods/demo/demo.html");

//ACTOR AND DIALOGUE REGISTRATION

//registering Idril as an actor on this page
demomod.registerActor("idril", {
    image: "/img/sprites/obesk/idril/portrait.gif",
    type: "obesk qou portrait-contain",
    voice: ()=>play("talkmind", 0.8)
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

//register the actual dialogue
demomod.registerDialogue("hi-vekoa", `
start
    sys
        NOTICE::'memory stream located'

    idril
        hi vekoa

    okidoia
        ÷mÔ3Ôhií-ÿä›

    sys
        NOTICE::'memory stream terminated'

    RESPONSES::sys
        return<+>END
            EXEC::moveTo("/local/depths/")
`, forPages=['/local/uncosm/hi vekoa']);

//HANDLER TO INIT DIALOGUE

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