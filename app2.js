// Your Google API key and Custom Search Engine ID
const API_KEY = "AIzaSyB0_m2orhux3oT1kr08-FRraS1QIa6R2gI";
const CX = "920b609ddc31640b8";

async function checkAndSearchDisease(plantName = null) {
    // Use top prediction if available
    if(!plantName && lastPrediction){
        const topPrediction = lastPrediction.reduce((a,b) => a.probability > b.probability ? a : b);
        plantName = topPrediction.className;
    }
    if(!plantName) plantName = "tomato"; // fallback

    const query = `${plantName} leaf disease`;
    const textUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;
    const imageUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&searchType=image`;

    const container = document.getElementById("label-container");
    container.innerHTML += "<hr><div><b>Fetching disease info...</b></div>";

    try {
        // Fetch text results
        const textResponse = await fetch(textUrl);
        const textData = await textResponse.json();
        if(textData.items && textData.items.length > 0){
            container.innerHTML += "<div><b>Top Disease Info (Text):</b></div>";
            textData.items.slice(0,3).forEach(item => {
                const div = document.createElement("div");
                div.innerHTML = `<b>${item.title}</b><br>${item.snippet}<br><a href="${item.link}" target="_blank">Link</a><br><br>`;
                container.appendChild(div);
            });
        } else {
            container.innerHTML += "<div>No text results found from Google API.</div>";
        }

        // Fetch image results
        const imageResponse = await fetch(imageUrl);
        const imageData = await imageResponse.json();
        if(imageData.items && imageData.items.length > 0){
            container.innerHTML += "<div><b>Top Disease Images:</b></div>";
            imageData.items.slice(0,3).forEach(item => {
                const img = document.createElement("img");
                img.src = item.link;
                img.width = 200;
                img.height = 200;
                img.style.marginRight = "10px";
                container.appendChild(img);
            });
        } else {
            container.innerHTML += "<div>No image results found from Google API.</div>";
        }

    } catch(err){
        console.error("Error fetching disease info:", err);
        container.innerHTML += "<div style='color:red'>Error fetching disease info. Check API key and network.</div>";
    }
}
