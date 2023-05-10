/*
    TO DO :
    constraints cannot correctly handle always true or always false conditions
        example : 0*x1 + 0*x2 >= 0
*/



var canvas;
var ctx;

class vec2{
    constructor(x = 0, y = 0){
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    add(r) { return new vec2( this.x + r.x, this.y + r.y ); }
    sub(r) { return new vec2( this.x - r.x, this.y - r.y ); }
    mul(r) { return new vec2( this.x * r.x, this.y * r.y ); }
    div(r) { return new vec2( this.x / r.x, this.y / r.y ); }

    add_scalar(r) { return this.add(new vec2(r, r)); }
    sub_scalar(r) { return this.sub(new vec2(r, r)); }
    mul_scalar(r) { return this.mul(new vec2(r, r)); }
    div_scalar(r) { return this.div(new vec2(r, r)); }

    component_sum() { return this.x + this.y; }
    dot(r) { return this.mul(r).component_sum(); }
    length_squared() { return this.mul(this).component_sum(); }
    length() { return Math.sqrt(this.length_squared()); }
    normalize() { return this.div_scalar(this.length()); }

    compare(r) { return this.x === r.x && this.y === r.y }
}

function math_to_canvas_coord(canvas_coord){
    return canvas_coord.div(canvas_scale).add(canvas_offset);
}

function canvas_to_math_coord(math_coord){
    return math_coord.sub(canvas_offset).mul(canvas_scale);
}

class constraint{
    constructor(esign, p1, p2, m, c){
        this.esign = esign; 
        this.p1    = new vec2(p1.x, p1.y);
        this.p2    = new vec2(p2.x, p2.y);
        this.m     = parseFloat(m);
        this.c     = parseFloat(c);
    }

    y_of(x) { return this.m * parseFloat(x) + this.c; }

    x_of(y) { return (parseFloat(y) - this.c) / this.m; }

    get_draw_points(){
        const min = canvas_to_math_coord(new vec2(0,0));
        const max = canvas_to_math_coord(new vec2(canvas.width, canvas.height));
        return this.p1.x === this.p2.x ?
        {
            p1:new vec2(this.p1.x, min.y),
            p2:new vec2(this.p2.x, max.y),
        } :
        {
            p1:new vec2(min.x, this.y_of(min.x)),
            p2:new vec2(max.x, this.y_of(max.x)),
        }
    }

    is_valid_point(p){
        if (this.m === -Infinity){
            switch (this.esign){
                case "==": return p.x == this.p1.x;
                case "<=": return p.x <= this.p1.x;
                case ">=": return p.x >= this.p1.x;
            }
        }
        else{
            switch (this.esign){
                case "==": return p.y == this.y_of(p.x);
                case "<=": return p.y <= this.y_of(p.x);
                case ">=": return p.y >= this.y_of(p.x);
            }
        }
        return false;
    }

    get_intersect(other){
        if (this.m === other.m) return null;
        if (this.m === -Infinity)
            return new vec2(this.p1.x, other.y_of(this.p1.x));
        if (other.m === -Infinity)
            return new vec2(other.p1.x, this.y_of(other.p1.x));
        /*
            y = m1*x + c1
            y = m2*x + c2
            0 = (m1-m2)*x + (c1-c2)
            x = (c2-c1) / (m1-m2)
        */
        const x = (other.c - this.c) / (this.m - other.m);
        return new vec2(x, this.y_of(x));
    }
};

function constraint_from_qqsc(_q1,_q2,esign,_c1){
    const w = canvas.width * 10;
    const q1 = parseFloat(_q1);
    const q2 = parseFloat(_q2);
    const c1 = parseFloat(_c1);
    const m = q1 / -q2;
    const c = c1 / q2;
    const d = (m === -Infinity) ? {
        p1:new vec2(c1 / q1, -w),
        p2:new vec2(c1 / q1, 2*w)
    } : {
        p1:new vec2(-w, m * (-w) + c),
        p2:new vec2(2*w, m * (2*w) + c)
    };
    let sign = esign;
    if (q2<0){
        sign = 
            sign === '>=' ? '<=' : 
            sign === '<=' ? '>=' : 
            sign;
    }
    return new constraint(
        sign, d.p1, d.p2, m, c
    );
}


class constraint_row{
    constructor(tr){
        this.tr    = tr;
        this.q1    = tr.querySelector("#q1");
        this.q2    = tr.querySelector("#q2");
        this.esign = tr.querySelector("#eSign");
        this.c     = tr.querySelector("#c");
        this.color = tr.querySelector("#clr");
        this.constraint = {};
        this.consistent_result = null;
        this.update_line();
    }

    update_line(){
        this.constraint = constraint_from_qqsc(
            this.q1.value,
            this.q2.value,
            this.esign.value,
            this.c.value,
        );
        this.consistent_result = null;
        this.tr.style.backgroundColor = this.color.value;
    }
}

let user_constraints = [];
let domain_constraints = [];
let max_point = new vec2(1,1).mul_scalar(1000000000000);
let canvas_constraints = [];
let canvas_offset = new vec2();
let canvas_scale = new vec2(1.0, 1.0);

function setElementValue(id, valueToSelect) {   
    console.log(`Setting ${id} to ${valueToSelect}`); 
    let element = document.getElementById(id);
    element.value = valueToSelect;
}

function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      load_file_contents(contents);
    };
    reader.readAsText(file);
}

function load_file_contents(contents) {
    let fileLines = contents.split("\n");
    fileLines = fileLines.map(l=>l.split(" "));

    // setup obj function
    objFunc = fileLines[0];
    console.log(objFunc);

    setElementValue('minmax', objFunc[0]);
    setElementValue('q1', parseFloat(objFunc[1]));
    setElementValue('q2', parseFloat(objFunc[2]));

    const ct = document.getElementById("ctbody");
    user_constraints.forEach(c=>{ct.removeChild(c.tr)})
    user_constraints = [];
    fileLines
    .slice(1, fileLines.length-1)
    .forEach(values=>{
        // +2 +1 <= 5
        console.log(values);

        add_constraint(
            parseFloat(values[0]),
            parseFloat(values[1]),
                      (values[2]),
            parseFloat(values[3])
        );
    });

    let ll = fileLines.pop();
    const cvrt = e=>
        e === "+" ?     ">=" : 
        e === "-" ?     "<=" : 
        e === "urs" ?   null :
        e === "int" ?   null : // what?
        e === "bin" ?   null : // what?
        null;
    ll = ll.map(e=>cvrt(e));
    console.log(ll);
    domain_constraints = [];
    if (ll[0]) domain_constraints.push(constraint_from_qqsc(1,0,ll[0],0));
    if (ll[1]) domain_constraints.push(constraint_from_qqsc(0,1,ll[1],0));
    
    update();
    view_valid_zone();
  }

  function setup(){
      // attach file-input button event
      document.getElementById('file-input').addEventListener('change', readSingleFile);
      
      canvas = document.getElementById("canvas1");
      ctx = canvas.getContext("2d");
      
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      canvas_constraints = [
          constraint_from_qqsc(1,0,"<=",  max_point.x),
          constraint_from_qqsc(1,0,">=", -max_point.x),
          constraint_from_qqsc(0,1,">=", -max_point.y),
          constraint_from_qqsc(0,1,"<=",  max_point.y)
        ];
        
        domain_constraints = [
            constraint_from_qqsc(1,0,">=",0),
            constraint_from_qqsc(0,1,">=",0)
        ];
        
        let click_pos = new vec2();
        let co = new vec2();
        let cd = new vec2();
        const pan_action = mouse_pos => {
            const mp = new vec2( mouse_pos.offsetX, mouse_pos.offsetY );
            cd = mp.sub(click_pos).mul(new vec2(1,-1));
            canvas_offset = co.add(cd);
        };
        const start_pan = mouse_pos => {
            click_pos = new vec2( mouse_pos.offsetX, mouse_pos.offsetY );
            canvas.addEventListener('mousemove', pan_action);
            canvas.addEventListener('mouseup', end_pan);
            canvas.addEventListener('mouseout', end_pan);
            co = new vec2(canvas_offset.x, canvas_offset.y);
            cd = new vec2(0,0);
        };
        const end_pan = mouse_pos => {
            canvas.removeEventListener('mousemove', pan_action);
            canvas.removeEventListener('mouseup', end_pan);
            canvas.removeEventListener('mouseout', end_pan);
        };
        canvas.addEventListener('mousedown', start_pan);

        let a = 0;
        const scroll_action = ev=>{
            const d = ev.deltaY > 0 ? 1.1 : 0.9;
            canvas_scale = canvas_scale.mul_scalar(d);
            ev.preventDefault();
            return false;
        }
        canvas.addEventListener('wheel', scroll_action, false);

        update();
        draw();
    };
    window.onload = setup;
    
    
    function get_valid_points(){
        // get lines
        const lines = 
        user_constraints.map(c=>{ return c.constraint })
        .concat(canvas_constraints)
        .concat(domain_constraints);
        
        let valid_points = [];
        lines.forEach((la, a, lines_a)=>{
            lines_a.slice(a+1).forEach((lb, b, lines_b)=>{
                const p = la.get_intersect(lb);
                if (p === null) return;
            if (lines.every(l=>{ return l.is_valid_point(p); }))
                valid_points.push(p);
        });
    });
    return valid_points;
}

function poly_sort(in_points){
    // note can only work for convex shapes
    if (in_points.length === 0) return;
    let points = in_points.map(p=>{ return p; });
    //find left most point :
    points.sort((l,r)=>{ return r.x - l.x }); // descending by x
    let p = points.pop(); // the left most point
    let dir = new vec2(-1,0); // moving left more
    let res = [p];
    while(points.length > 0){
        points.sort((l, r)=>{
            const ldir = l.sub(p).normalize();
            const rdir = r.sub(p).normalize();
            return ldir.dot(dir) - rdir.dot(dir);
        });
        const np = points.pop();
        dir = np.sub(p).normalize();
        res.push(np);
        p = np;
    }
    return res;
}

let rainbow_i = 0
const rainbow = ["#FF0018", "#FFA52C", "#FFFF41", "#008018", "#0000F9", "#86007D"];
const rainbow_i_next = ()=>rainbow_i = (rainbow_i + 1) % rainbow.length
const rainbow_next = ()=>rainbow[rainbow_i_next()]


function add_constraint(q1 = 0, q2 = 0, esign = "<=", c = 0, color = rainbow_next()){
    let tr = document.createElement("tr");
    tr.innerHTML = `
        <td id="trid"> C${user_constraints.length + 1} </td>
        <td><input id="q1" type="number" value=${q1} onchange="update()"> * x1 + </td>
        <td><input id="q2" type="number" value=${q2} onchange="update()"> * x2</td>
        <td>
            <select id="eSign" onchange="update()"> 
                <option value="==">==</option>
                <option value=">=">>=</option>
                <option value="<="><=</option>
            </select>
        </td>
        <td><input id="c" type="number" value=${c} onchange="update()"></td>
        <td><input id="clr" type="color" value="${color}" onchange="update()"></td>
        <td><button id="del">-</button></td>
    `;
    tr.querySelector("#eSign").value = esign;
    
    document.getElementById("ctbody").appendChild(tr);
    
    const ncr = new constraint_row(tr);
    ncr.update_line();
    user_constraints.push(ncr);
    
    tr.querySelector("#del").onclick = ()=>{
        document.getElementById("ctbody").removeChild(tr);
        user_constraints = user_constraints.filter(e=>e!==ncr);
        user_constraints.forEach((e,i)=>{
            e.tr.querySelector("#trid").innerHTML = `C${i+1}`;
        });
        update();
    };
}

function draw_oct(pos, size = 8, rot = 0.0){
    let points = [
        new vec2(-2, 1),
        new vec2(-2,-1),
        new vec2(-1,-2),
        new vec2( 1,-2),
        new vec2( 2,-1),
        new vec2( 2, 1),
        new vec2( 1, 2),
        new vec2(-1, 2)
    ];
    points.forEach((p, i, pa)=>{
        pa[i] = new vec2( // rotate
            p.x * Math.cos(rot) - p.y * Math.sin(rot),
            p.x * Math.sin(rot) + p.y * Math.cos(rot)
        ).mul_scalar(size*0.5).add(pos);
    });
    draw_poly(points);
}

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
    if (points.length === 0) return;
    const fp = math_to_canvas_coord(points[0]);
    ctx.beginPath();
    ctx.moveTo(fp.x, fp.y);
    points.slice(1).forEach((el, i)=>{
        const p = math_to_canvas_coord(el);
        ctx.lineTo(p.x, p.y);
    });
    if (points.length === 2) 
        ctx.stroke();
    else 
        ctx.fill();
}

function view_valid_zone(){
    update();
    let points = valid_zone.points.map(p=>p);
    let points_x = points.map(p=>p.x);
    let points_y = points.map(p=>p.y);

    let min = new vec2(
        Math.min(...points_x),
        Math.min(...points_y),
    );
    let max = new vec2(
        Math.max(...points_x),
        Math.max(...points_y),
    );

    canvas_scale = max.sub(min)
        .div(new vec2(canvas.width, canvas.height))
        .mul_scalar(2);
    canvas_offset = min
        .div(canvas_scale)
        .sub(max.sub(min))
        .sub(min.mul(new vec2(1,0)));

}

let valid_zone = {
    points:[],
    poly:[],
    best:[],
    poly_color:{ r:0.4, g:0.2, b:0.8, a:0.5 }
};
let z;
let htmlZ;
function update()
{
    valid_zone.poly = [];
    valid_zone.best = [];
    
    //update constraints
    user_constraints.forEach(c=>c.update_line());

    valid_zone.points = get_valid_points();
    if (valid_zone.points.length === 0) return;

    // create valid area poly
    valid_zone.poly = poly_sort(valid_zone.points);

    // find best points 
    htmlZ = document.getElementById("Z");
    z = {
        q:new vec2(
            htmlZ.querySelector("#q1").value,
            htmlZ.querySelector("#q2").value
        ),
        s:htmlZ.querySelector("#minmax").value === "min",
        line:null,
        calc(p) 
        { 
            return this.q.mul(p).component_sum() 
        },
    };
    valid_zone.points.sort((l ,r) => z.calc(r) - z.calc(l));
    if (z.s) valid_zone.points.reverse();
    const bp = valid_zone.points[0];
    const bestz = z.calc(bp); 
    valid_zone.best = valid_zone.points.filter(p=>z.calc(p) === bestz);
    
    let z1 = bestz;
    let x1 = bp.x; if (x1 === max_point.x) { x1 = Infinity; z1 = Infinity; }
    let x2 = bp.y; if (x2 === max_point.y) { x2 = Infinity; z1 = Infinity; }
    document.getElementById("answer_line0").innerHTML = `= ${z.q.x} * ${x1} + ${z.q.y} * ${x2}`
    document.getElementById("answer_line1").innerHTML = `= ${z1}`
    document.getElementById("answer_line2").innerHTML = `= ${x1}`
    document.getElementById("answer_line3").innerHTML = `= ${x2}`
    document.getElementById("answer_line4").innerHTML = `= ${z1}`
    

    z.line = constraint_from_qqsc(z.q.x, z.q.y,"==",0);
    z.line.c = 
        z.line.p1.x !== z.line.p2.x ?
        bp.y - bp.x * z.line.m : bp.x;
}

let rot = 0.0;
function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    const draw_constraint = c=>{
        const l = c.get_draw_points();
        draw_line(l.p1, l.p2);
    };

    ctx.lineWidth = -canvas_scale.length_squared();
    user_constraints.forEach(row=>{
        ctx.strokeStyle = row.color.value;
        draw_constraint(row.constraint);
    });

    ctx.strokeStyle = "#000000";
    domain_constraints.forEach(draw_constraint);
    canvas_constraints.forEach(draw_constraint);
    
    const color = valid_zone.poly_color;
    const color_int = 
        parseInt(color.r * parseInt("FF", 16)) * parseInt("01000000", 16) +
        parseInt(color.g * parseInt("FF", 16)) * parseInt("00010000", 16) +
        parseInt(color.b * parseInt("FF", 16)) * parseInt("00000100", 16) +
        parseInt(color.a * parseInt("FF", 16)) * parseInt("00000001", 16);
    ctx.fillStyle = '#' + color_int.toString(16);
    draw_poly(valid_zone.poly);
    
    const draw_star = (p, i, color)=>{
        ctx.fillStyle = color;
        draw_oct(p, 
            (8 + 2 * (1 + Math.cos(rot)) * 0.5) * canvas_scale.x, 
            rot * (i % 2 === 0 ? 1 : -1)
            );
        }
        
        valid_zone.points.forEach((p, i)=>{
            draw_star(p, i, "#00FFF040");
        });
        
        valid_zone.best.forEach((p, i)=>{
            draw_star(p, i, "#FF000090");
    });

    if (z.line) {
        const zl = z.line.get_draw_points();
        draw_line(zl.p1, zl.p2);
    }
    

    rot += 0.05;
    
    // schedule next frame :
    window.requestAnimationFrame(draw);
}