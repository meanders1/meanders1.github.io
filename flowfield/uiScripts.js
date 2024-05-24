function toggleCustomisationMenu() {
    const menuEl = document.getElementById("customisationMenu");
    const iconEl = document.getElementById("customisationMenuIcon");
    if(menuEl.style.display != "none") {
        menuEl.style.display = "none";
        iconEl.style.display = "block";
    } else {
        menuEl.style.display = "block";
        iconEl.style.display = "none";
    }
}


window.addEventListener("load", () => {
    window.onkeyup = (e) => {
        let keynum;
        if(window.event) {
            keynum = e.keyCode;
        } else if(e.which) {
            keynum = e.which;
        }
    
        const key = String.fromCharCode(keynum).toLowerCase();
        if(key == "m") {
            toggleCustomisationMenu();
        }
    }
    
    const iconEl = document.getElementById("customisationMenuIcon");
    iconEl.addEventListener("click", toggleCustomisationMenu);
});