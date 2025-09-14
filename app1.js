const MODEL_URL = "https://teachablemachine.withgoogle.com/models/b3mCDtciI/";

let model = null;
let maxPredictions = 0;
let webcam = null;
let uploadedImage = null;
let lastPrediction = null;

const labelContainer = document.getElementById("label-container");

// 1️⃣ Load model
async function loadModel() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    console.log("Model loaded!");
    labelContainer.innerHTML = "<div style='color:green'>Model loaded! You can use webcam or upload an image.</div>";
}
loadModel();

// 2️⃣ Start webcam
document.getElementById("startWebcam").addEventListener("click", async function(){
    if(webcam) return; // already running

    const flip = true;
    webcam = new tmImage.Webcam(200, 200, flip);
    await webcam.setup();
    await webcam.play();

    const container = document.getElementById("webcam-container");
    container.innerHTML = "";
    container.appendChild(webcam.canvas);

    requestAnimationFrame(webcamLoop);
});

// Webcam loop
async function webcamLoop() {
    if(!webcam) return;
    webcam.update();
    await predict(webcam.canvas, false); // false = don't call API
    requestAnimationFrame(webcamLoop);
}

// 3️⃣ Handle image upload
document.getElementById("imageUpload").addEventListener("change", function(event){
    const file = event.target.files[0];
    if(!file){
        uploadedImage = null;
        document.getElementById("image-container").innerHTML = "";
        document.getElementById("useAPIButton").style.display = "none";
        return;
    }

    // Stop webcam if running
    if(webcam){
        webcam.stop();
        webcam = null;
        document.getElementById("webcam-container").innerHTML = "";
    }

    const img = document.createElement("img");
    img.width = 200;
    img.height = 200;

    img.onload = function(){
        uploadedImage = img;
        labelContainer.innerHTML = "";
        document.getElementById("useAPIButton").style.display = "none"; // hide until Get Result
    }

    img.src = URL.createObjectURL(file);

    const container = document.getElementById("image-container");
    container.innerHTML = "";
    container.appendChild(img);
});

// 4️⃣ Predict function
async function predict(input, callAPI = false){
    if(!model) return;

    const prediction = await model.predict(input);
    lastPrediction = prediction;

    labelContainer.innerHTML = "";
    prediction.forEach(p => {
        const div = document.createElement("div");
        div.innerText = `${p.className}: ${p.probability.toFixed(2)}`;
        div.style.color = "black";
        labelContainer.appendChild(div);
    });

    if(callAPI){
        const diseaseProb = prediction.find(p => p.className.toLowerCase() === "diseased")?.probability || 0;
        const healthyProb = prediction.find(p => p.className.toLowerCase() === "healthy")?.probability || 0;
        if(diseaseProb > healthyProb){
            if(typeof checkAndSearchDisease === "function"){
                // ask user for plant/tree name
                const plantName = prompt("Enter the plant/tree name (e.g., Tomato, Mango, Rose):");
                if(plantName && plantName.trim() !== ""){
                    checkAndSearchDisease(plantName.trim());
                } else {
                    labelContainer.innerHTML += "<div style='color:red'>You must enter a plant name to search.</div>";
                }
            }
        } else {
            labelContainer.innerHTML += "<div style='color:green'>Plant appears healthy. No need to use API.</div>";
        }
    }
}

// 5️⃣ Get Result button
document.getElementById("predictButton").addEventListener("click", async function(){
    if(!uploadedImage){
        labelContainer.innerHTML = "<div style='color:red'>No file chosen. Choose a file first!</div>";
        document.getElementById("useAPIButton").style.display = "none";
        return;
    }
    await predict(uploadedImage, false);
    document.getElementById("useAPIButton").style.display = "inline-block";
});

// 6️⃣ Use API button
document.getElementById("useAPIButton").addEventListener("click", async function(){
    if(!uploadedImage){
        labelContainer.innerHTML = "<div style='color:red'>No file chosen. Choose a file first!</div>";
        return;
    }
    if(!lastPrediction){
        labelContainer.innerHTML += "<div style='color:red'>Please click Get Result first!</div>";
        return;
    }
    await predict(uploadedImage, true); // call API and prompt for plant name if diseased
});
