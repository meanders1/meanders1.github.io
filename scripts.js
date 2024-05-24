window.addEventListener("load", () => {
    let projects = document.querySelectorAll(".sidebarLink");
    let images = document.querySelectorAll(".previewImage");
    for(let sidebarEl of projects) {
        let id = sidebarEl.id;
        let projectName = id.substring("sidebar".length);
        let previewId = "preview" + projectName;
        let img = document.getElementById(previewId);
        
        sidebarEl.addEventListener("mouseover", () => {
            for(let image of images) {
                image.style = "display: none;";
            }
            img.style = "display: inline;";
        });
    }
});
