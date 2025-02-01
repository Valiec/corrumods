document.addEventListener('corru_act', (ev)=>{
    const entity = ev.detail.entity; //what's being acted upon
    const action = ev.detail.action; //the action

    if(action.name == "unity") {
        if(!["god", "geli", "beautiful parasite", "council", "fairy", "isabel", "proxyfriend?"].includes(entity.name)) {       
            let useCount = Number(check("unity") || 0)
            change("unity",  ++useCount); //this is the only line I actually changed, the actual game has useCount++

            if(useCount == 5) {
                chatter({actor: 'moth', text: "hey dude maybe take it easy with this unity thing", readout: true, delay: 12000})
                chatter({actor: 'moth', text: "let's not destabilize the whole cyst", readout: true, delay: 14000})
            }
        }
    }
})
