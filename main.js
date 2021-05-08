window.onload = draw;

function draw() {
    let canvas = document.getElementById("canvas1");

    let ctx = canvas.getContext("2d");

    // draw shape
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(200, 50);
    ctx.lineTo(200, 200);
    ctx.lineTo(100, 150);
    ctx.fill();

    // draw lines x2
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, 400);
    ctx.stroke();

    // draw lines x1
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, 390);
    ctx.lineTo(400, 390);
    ctx.stroke();

    // draw lines x1
    ctx.strokeStyle = "#345beb";
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(400, 0);
    ctx.stroke();
}

    

function loadInputValue(){
    let fileInput = document.getElementById("fileInput");

    console.log(fileInput.value);

    let file = fileInput.value;

    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                alert(allText);
            }
        }
    }
    rawFile.send(null);
}