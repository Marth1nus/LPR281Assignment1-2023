/*
    TO DO :
    constratints cannot correctly handle always true or alwyas false conditions
        example : 0*x1 + 0*x2 >= 0

*/



var canvas;
var ctx;

function print_error(s) {
    console.error(s); 
}

function print(s) {
    console.log(s); 
}

class vec2{
    constructor(x = 0, y = 0){
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    add(r){ return new vec2( this.x + r.x, this.y + r.y ); }
    sub(r){ return new vec2( this.x - r.x, this.y - r.y ); }
    mul(r){ return new vec2( this.x * r.x, this.y * r.y ); }
    div(r){ return new vec2( this.x / r.x, this.y / r.y ); }

    add_scalar(r){ return new vec2( this.x + parseFloat(r), this.y + parseFloat(r) ); }
    sub_scalar(r){ return new vec2( this.x - parseFloat(r), this.y - parseFloat(r) ); }
    mul_scalar(r){ return new vec2( this.x * parseFloat(r), this.y * parseFloat(r) ); }
    div_scalar(r){ return new vec2( this.x / parseFloat(r), this.y / parseFloat(r) ); }

    dot(r) { return this.x * r.x + this.y * r.y; }

    length_sqr() { return this.mul(this).comp_sum(); }

    length() { return Math.sqrt(this.length_sqr()); }

    normalise() { return new vec2(this.x, this.y).div_scalar(this.length()); }

    comp_sum() { return this.x + this.y; }

    compair(r) { return this.x === r.x && this.y === r.y }
}

let user_constraints = [];

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

    is_valid_point(p){
        if (this.m === -Infinity){
            switch (this.esign){
                case "==": if (p.x == this.p1.x) return true; break;
                case "<=": if (p.x <= this.p1.x) return true; break;
                case ">=": if (p.x >= this.p1.x) return true; break;
                case "<" : if (p.x <  this.p1.x) return true; break;
                case ">" : if (p.x >  this.p1.x) return true; break;
                default: print_error("esign was invalid");
            }
        }
        else{
            switch (this.esign){
                case "==": if (p.y == this.y_of(p.x)) return true; break;
                case "<=": if (p.y <= this.y_of(p.x)) return true; break;
                case ">=": if (p.y >= this.y_of(p.x)) return true; break;
                case "<" : if (p.y <  this.y_of(p.x)) return true; break;
                case ">" : if (p.y >  this.y_of(p.x)) return true; break;
                default: print_error("esign was invalid");
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
    return new constraint(
        esign, d.p1, d.p2, m, c
    );
}


class contraint_row{
    constructor(tr){
        this.tr    = tr;
        this.q1    = tr.querySelector("#q1");
        this.q2    = tr.querySelector("#q2");
        this.esign = tr.querySelector("#eSign");
        this.c     = tr.querySelector("#c");
        this.color = tr.querySelector("#clr");
        this.constraint = {};
        this.consitant_result = null;
        this.update_line();
    }

    update_line(){
        this.constraint = constraint_from_qqsc(
            this.q1.value,
            this.q2.value,
            this.esign.value,
            this.c.value
        );
        this.consitant_result = null;
    }
}

let canvas_constraints = []
let canvas_offset = new vec2();
let canvas_offset_temp = new vec2();
let canvas_scale = new vec2(1.0, 1.0);

window.onload = ()=>{
    canvas = document.getElementById("canvas1");
    ctx = canvas.getContext("2d");

    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    const w = canvas.width * 10;
    canvas_constraints = [
        constraint_from_qqsc(1,0,">=", 0),
        constraint_from_qqsc(1,0,"<=", w),
        constraint_from_qqsc(0,1,">=", 0),
        constraint_from_qqsc(0,1,"<=", w)
    ];

    let click_pos = new vec2();
    const pan_action = mouse_pos => {
        const mp = new vec2( mouse_pos.offsetX, mouse_pos.offsetY );
        canvas_offset_temp = mp.sub(click_pos).mul(new vec2(1,-1));
    };
    const start_pan = mouse_pos => {
        click_pos = new vec2( mouse_pos.offsetX, mouse_pos.offsetY );
        canvas.addEventListener('mousemove', pan_action);
        canvas.addEventListener('mouseup', end_pan);
        canvas.addEventListener('mouseout', end_pan);
    };
    const end_pan = mouse_pos => {
        canvas_offset = canvas_offset.add(canvas_offset_temp);
        canvas.removeEventListener('mousemove', pan_action);
        canvas.removeEventListener('mouseup', end_pan);
        canvas.removeEventListener('mouseout', end_pan);
        canvas_offset_temp = new vec2(0,0);
    };
    canvas.addEventListener('mousedown', start_pan);

    update();
    draw();
};


function get_valid_points(){
    // get lines
    const lines = 
    user_constraints.map((c)=>{ return c.constraint }).
    concat(canvas_constraints);
    
    let valid_points = [];
    lines.forEach((la, a, lines_a)=>{
        lines_a.slice(a+1).forEach((lb, b, lines_b)=>{
            const p = la.get_intersect(lb);
            if (p === null) return;
            if (lines.every((l)=>{ return l.is_valid_point(p); }))
                valid_points.push(p);
        });
    });
    return valid_points;
}

function poly_sort(in_points){
    // note can only work for convex shapes
    if (in_points.length === 0) return;
    let points = in_points.map((p)=>{ return p; });
    //find left most point :
    points.sort((l,r)=>{ return r.x - l.x }); // decending by x
    let p = points.pop(); // the left most point
    let dir = new vec2(-1,0); // moving left more
    let res = [p];
    while(points.length > 0){
        points.sort((l, r)=>{
            const ldir = l.sub(p).normalise();
            const rdir = r.sub(p).normalise();
            return ldir.dot(dir) - rdir.dot(dir);
        });
        const np = points.pop();
        dir = np.sub(p).normalise();
        res.push(np);
        p = np;
    }
    return res;
}

function add_constraint(q1 = 0, q2 = 0, esign = "<=", c = 0, color = "#ff0000"){
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
                <option value=">">></option>
                <option value="<"><</option>
            </select>
        </td>
        <td><input id="c" type="number" value=${c} onchange="update()"></td>
        <td><input id="clr" type="color" value="${color}" onchange="update()"></td>
        <td><button id="del">-</button></td>
    `;
    tr.querySelector("#eSign").value = esign;
    
    document.getElementById("ctbody").appendChild(tr);
    
    const ncr = new contraint_row(tr);
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
    ctx.beginPath();
    const o = canvas_offset.add(canvas_offset_temp);
    points.forEach((el, i)=>{
        let p = el.add(o).mul(canvas_scale);
        if (i===0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    if (points.length === 2) ctx.stroke();
    else ctx.fill();
}

let valid_zone = {
    points:[],
    poly:[],
    best:[],
    poly_color:{ r:0.4, g:0.2, b:0.8, a:0.5 }
};

let htmlZ;
let z = {q:new vec2()};
function update()
{
    valid_zone = {
        points:[],
        poly:[],
        best:[],
        poly_color:valid_zone.poly_color
    };
    
    user_constraints.forEach((c)=>{c.update_line()});
    valid_zone.points = get_valid_points();
    if (valid_zone.points.length === 0) return;
    valid_zone.poly = poly_sort(valid_zone.points);
    htmlZ = document.getElementById("Z");
    z = {
        q:new vec2(
            htmlZ.querySelector("#q1").value,
            htmlZ.querySelector("#q2").value
            ).mul_scalar(
                htmlZ.querySelector("#minmax").value === "min" ? -1 : 
                htmlZ.querySelector("#minmax").value === "max" ? 1 : 1
            )
        };
    valid_zone.points.sort((l ,r)=>{
        const v1 = r.mul(z.q).comp_sum();
        const v2 = l.mul(z.q).comp_sum();
        return v1 - v2;
    });
    const bp = valid_zone.points[0];
    const bestz = bp.mul(z.q).comp_sum(); 
    valid_zone.best = valid_zone.points.filter(p=>p.mul(z.q).comp_sum() >= bestz);
    

}

let rot = 0.0;
function draw() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    ctx.lineWidth = 2;
    user_constraints.forEach((row)=>{
        ctx.strokeStyle = row.color.value;
        draw_line(
            row.constraint.p1, 
            row.constraint.p2
        );
    });

    canvas_constraints.forEach((c)=>{
        ctx.strokeStyle = "#000000";
        draw_line(c.p1, c.p2);
    });
    
    const color = valid_zone.poly_color;
    const color_int = 
        parseInt(color.r * parseInt("FF", 16)) * parseInt("01000000", 16) +
        parseInt(color.g * parseInt("FF", 16)) * parseInt("00010000", 16) +
        parseInt(color.b * parseInt("FF", 16)) * parseInt("00000100", 16) +
        parseInt(color.a * parseInt("FF", 16)) * parseInt("00000001", 16);
    ctx.fillStyle = '#' + color_int.toString(16);
    draw_poly(valid_zone.poly);
    
    valid_zone.points.forEach((p, i)=>{
        ctx.fillStyle = "#00FFF040";
        draw_oct(p, 
            8 + 2 * (1 + Math.cos(rot)) * 0.5 , 
            rot * (i % 2 === 0 ? 1 : -1)
            );
        });
        
    valid_zone.best.forEach((p, i)=>{
        ctx.fillStyle = "#FF000090"
        draw_oct(p, 
            8 + 2 * (1 + Math.cos(rot)) * 0.5 , 
            rot * (i % 2 === 0 ? 1 : -1)
            );
    });
    

    rot += 0.05;
    
    // schedule next frame :
    window.requestAnimationFrame(draw);
}