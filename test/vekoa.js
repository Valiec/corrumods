const vekoamod = new Mod("vekoa");

//testing both formats
vekoamod.registerCustomPage("https://corru.observer/local/valiec", "/local/ozo");
vekoamod.registerCustomPage("/local/idril", "/local/depths");
vekoamod.registerCustomPage("/local/uncosm/hivekoa/", "https://valiec.github.io/corrumods/test/hivekoa.html");
vekoamod.registerActor("idril", {
    image: "/img/sprites/obesk/idril/portrait.gif",
    type: "obesk qou portrait-contain",
    voice: ()=>play("talkmind", 0.8)
}, forPages=['/local/uncosm/hi vekoa/']);

vekoamod.registerActor("okidoia", {
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
}, forPages=['/local/uncosm/hi vekoa/']);


vekoamod.registerDialogue("hi-vekoa", `
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
`, forPages=['/local/uncosm/hivekoa/']);


document.addEventListener('corru_entered', function() {
    if(urlToKey(window.location.href) == "/local/uncosm/hivekoa")
    {
    	initCurrentPage();
    	startDialogue("hi-vekoa");
    }
});