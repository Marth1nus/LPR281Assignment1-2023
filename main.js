var canvas;
var ctx;

function print_error(s) {
    console.log(s); 
}

function print(s) {
    console.log(s); 
}

function init(){
    canvas = document.getElementById("canvas1");
    ctx = canvas.getContext("2d");

    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    add_constraint(1,0,">=", 100);
    add_constraint(1,0,"<=", 200);
    add_constraint(0,1,">=", 100);
    add_constraint(0,1,"<=", 200);

    draw();
};

window.onload = init;

class vec2{
    constructor(x = 0, y = 0){
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    add(r){
        return new vec2(
            this.x + r.x,
            this.y + r.y
        );
    }
    sub(r){
        return new vec2(
            this.x - r.x,
            this.y - r.y
        );
    }
    mul(r){
        return new vec2(
            this.x * r.x,
            this.y * r.y
        );
    }
    div(r){
        return new vec2(
            this.x / r.x,
            this.y / r.y
        );
    }
}

let constraints = [];
class contraint_row{
    constructor(q1,q2,esign,c, color = "red"){
        this.q1 = q1;
        this.q2 = q2;
        this.esign = esign;
        this.c = c;
        this.color = color
    }

    get_data_points(){
        return {
            q1:parseFloat(this.q1.value),
            q2:parseFloat(this.q2.value),
            c:parseFloat(this.c.value),
            min_or_max:"GET DATA LATER"
        }
    }

    get_two_points()
    {
        // c = q1*x1 + q2*x2
        // c / q1 = x1
        // c / q2 = x2
        let d = this.get_data_points();
        let p1 = new vec2();
        let p2 = new vec2();
        if (d.q1 === 0.0) { // line is horizontal
            p1.y = p2.y = d.c/d.q2;
            p1.x = canvas.width;
        }
        else if (d.q2 === 0.0) { // line is vertical
            p2.x = p1.x = d.c/d.q1;
            p2.y = canvas.height;
        }
        else { // line is normal
            p1.x = d.c/d.q1;
            p2.y = d.c/d.q2;
        }
        return {p1:p1, p2:p2};
    }

    draw(){
        let l = this.get_two_points();
        ctx.fillStyle = this.color;
        draw_line(l.p1, l.p2);
    }
}

function get_valid_points(){
    // get all line data:
    let lines = []; 
    constraints.forEach((constraint) => {
        const points = constraint.get_two_points();
        const p1 = points.p1;
        const p2 = points.p2;
        const m = (p1.y - p2.y) / (p1.x -p2.x);
        const c = p1.y - m * p1.x;

        print("Point");
        print(points)

        /*
            m = p1.y / -p2.x
            c = p1.y
        */
        lines.push({
            points:points,
            m:m,
            c:c,
            esign:constraint.esign.value
        });
    });

    //compair lines to find points:
    let points = [];
    for (let a = 0; a < lines.length; a++){
        for (let b = a + 1; b < lines.length; b++){
            const la = lines[a];
            const lb = lines[b];


            if (la.m === lb.m) // lines parallel
                continue;

            /*
                y - m1*x = c1
                y - m2*x = c2

                eliminate y :
                    x = (c1-c2) / (m2-m1)
            */
            const x = (la.c - lb.c) / (lb.m - la.m);
            const y = la.m * x + la.c;
            const np = new vec2(x,y);
            //check duplicates
            
            points.push(np);
        }
    }

    //eliminate invalid points
    let valid_points = [];
    points.forEach((p)=>{
        lines.forEach((l)=>{
            /*
                y [<, >, <=, >=, =] mx + c
            */
            if (l.m === -Infinity){
                switch(l.esign) {
                    case "==" : if (l.points.p1.x == p.x) valid_points.push(p); break;
                    case "<=" : if (l.points.p1.x <= p.x) valid_points.push(p); break;
                    case ">=" : if (l.points.p1.x >= p.x) valid_points.push(p); break;
                    case "<"  : if (l.points.p1.x <  p.x) valid_points.push(p); break;
                    case ">"  : if (l.points.p1.x >  p.x) valid_points.push(p); break;
                    default: print_error("esign was invalid!"); break;
                }
            }
            else {
                let line_y = l.m * p.x + l.c;
                switch(l.esign) {
                    case "==" : if (line_y == p.y) valid_points.push(p); break;
                    case "<=" : if (line_y <= p.y) valid_points.push(p); break;
                    case ">=" : if (line_y >= p.y) valid_points.push(p); break;
                    case "<"  : if (line_y <  p.y) valid_points.push(p); break;
                    case ">"  : if (line_y >  p.y) valid_points.push(p); break;
                    default: print_error("esign was invalid!"); break;
                }
            }
        });
    });

    print(lines);
    print(points);
    print(valid_points);

    return valid_points;
}

function add_constraint(q1 = 0, q2 = 0, esign = "<=", c = 0){
    let tr = document.createElement("tr");
    tr.innerHTML = `
        <td> C${constraints.length + 1} </td>
        <td><input id="q1" type="number" value=${q1}></td>
        <td>x1</td>
        <td><input id="q2" type="number" value=${q2}></td>
        <td>x2</td>
        <td>
            <select id="eSign"> 
                <option value="==">==</option>
                <option value=">=">>=</option>
                <option value="<="><=</option>
                <option value=">">></option>
                <option value="<"><</option>
            </select>
        </td>
        <td><input id="c" type="number" value=${c}></td>
    `;
    tr.querySelector("#eSign").value = esign;

    document.getElementById("ctbody").appendChild(tr);

    constraints.push(
        new contraint_row(
            tr.querySelector("#q1"),
            tr.querySelector("#q2"),
            tr.querySelector("#eSign"),
            tr.querySelector("#c")
        )
    );
}

const o = new vec2(10,10);

function draw_line(p1,p2){ 
    draw_poly([p1, p2]); 
}
function draw_rect(p1,p2){ 
    draw_poly([
        new vec2(p1.x, p1.y),
        new vec2(p1.x, p2.y),
        new vec2(p2.x, p2.y),
        new vec2(p2.x, p1.y)
    ]);
}

function draw_poly(points){
    ctx.beginPath();
    points.forEach((el, i)=>{
        let p = el.add(o);
        if (i===0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    if (points.length === 2) ctx.stroke();
    else ctx.fill();
}

function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    // draw lines x1
    draw_line(
        new vec2(-10, 0), 
        new vec2(400, 0)
        );
    // draw lines x2
    draw_line(
        new vec2(0, -10), 
        new vec2(0, 400)
        );

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    constraints.forEach((row)=>{
       row.draw(); 
    });

    let valid_points = get_valid_points();
    ctx.fillStyle = "rgba(0,255,0,0.5)";
    draw_poly(valid_points);
}


    

function loadInputValue(){
    let fileInput = document.getElementById("fileInput");

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