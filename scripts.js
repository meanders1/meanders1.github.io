const projects = [
    {
        name: "Circulize",
        address: "/circulize/",
        previewImageSrc: "./assets/screenshot_Circulize.png"
    },
    {
        name: "Flowfield",
        address: "/flowfield/",
        previewImageSrc: "./assets/screenshot_Flowfield.png"
    },
    {
        name: "Word of Elements",
        address: "/woe/",
        previewImageSrc: "./assets/screenshot_WordOfElements.png"
    },
    {
        name: "Cloth",
        address: "/cloth/",
        previewImageSrc: "./assets/screenshot_Cloth.png"
    }
];

window.addEventListener("load", () => {
    const sidebar = document.getElementById("projectsSidebarContent");
    for(let i = 0; i < projects.length; i++) {
        const project = projects[i];
        
        // Sidebar text
        const sidebarText = document.createElement("p");
        sidebarText.innerHTML = "<a href=\"" + project.address + "\">" + project.name + "</a>";
        sidebarText.classList.add("sidebarLink");
        sidebar.appendChild(sidebarText);
        if(i < projects.length-1) {
            const separator = document.createElement("hr");
            separator.classList.add("sidebarDivider");
            sidebar.appendChild(separator);
        }

        // Preview image
        sidebarText.addEventListener("mouseover", () => {
            const previewDiv = document.getElementById("previewContainer");
            console.log("Mouseover triggered", previewDiv);  // Check if this is firing
            if (previewDiv) {
                previewDiv.style.backgroundImage = "url(" + project.previewImageSrc + ")";
            } else {
                console.error("Preview container not found!");
            }
        });
    }
});
