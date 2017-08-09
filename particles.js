"use strict";

var canvas,ctx,lastDraw,lastTick,drawId,tickId;
var MAX_PARTICLES = 200;
var dim = {
  MAX_DIM: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0
};
var prettyPath = true;
var G = 1e5;
var tps = 30;
var particles = [];
var rainbow = new Color.Gradient(["#f00","#ff0","#0f0","#0ff","#00f","#f0f"]);
var pointer = {
  x: 0,
  y: 0,
  r: 10,
  m: 20,
  isDown: false,
  downX: 0,
  downY: 0,
  moveT: 0,
  touchId: null,
  isTracked: true,
  down: function(x,y) {
		if(!this.isTracked) {
			this.isTracked = true;
			canvas.classList.add("track-pointer");
		};
		
    this.x = x;
    this.y = y;
    this.isDown = true;
    this.downX = x;
    this.downY = y;
    this.downT = Date.now();
  },
  move: function(x,y) {
		if(!this.isTracked) return;
    var dx = x-this.x;
    var dy = x-this.y;
    this.x = x;
    this.y = y;
    this.moveT = Date.now();
  },
  up: function(x,y) {
		if(!this.isTracked) return;
    this.isDown = false;
    this.x = x;
    this.y = y;
  },
  dragged: function() {
		if(!this.isTracked) return;
    if(!this.isDown) {
      return 0;
    } else {
      var dx = pointer.x-pointer.downX;
      var dy = pointer.y-pointer.downY;
      return Math.sqrt(dx*dx+dy*dy);
    }
  }
};
var resize = function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dim.MAX_DIM = Math.max(canvas.width,canvas.height);
  dim.minX = (canvas.width-dim.MAX_DIM)/2;
  dim.maxX = canvas.width-dim.minX;
  dim.minY = (canvas.height-dim.MAX_DIM)/2;
  dim.maxY = canvas.height-dim.minY;
  MAX_PARTICLES = dim.MAX_DIM*dim.MAX_DIM/10000;
};

window.addEventListener("load",function() {
    canvas = document.getElementById("particles");
    ctx = canvas.getContext("2d");

    window.addEventListener("resize",resize);

		canvas.classList.toggle("track-pointer", pointer.isTracked);
    canvas.addEventListener("mousedown", (event) => {
      pointer.down(event.clientX, event.clientY);
    });
    canvas.addEventListener("mousemove",function(e) {
        pointer.move(e.clientX,e.clientY);
    });
    canvas.addEventListener("mouseup",function(e) {
        pointer.up(e.clientX,e.clientY);
    });
    canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      const touch = e.changedTouches[0];

      if(pointer.touchId == null) {
        pointer.touchId = touch.identifier;
        pointer.down(touch.clientX,touch.clientY);
      }
    });
    canvas.addEventListener("touchmove",function(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        if(pointer.touchId==touch.identifier) {
            pointer.move(touch.clientX,touch.clientY);
        }
    });
    canvas.addEventListener("touchend",function(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        if(pointer.touchId==touch.identifier) {
            pointer.up(touch.clientX,touch.clientY);
            pointer.touchId = null;
        }
    });

    init();
});

document.addEventListener("keypress", ({ keyCode }) => {
  const T_KEY = 116;

  if(keyCode == T_KEY) {
    pointer.isTracked = !pointer.isTracked;
    canvas.classList.toggle("track-pointer", pointer.isTracked);

		if(pointer.isTracked && pointer.isDown) {
			pointer.up(pointer.x, pointer.y);
		}
  }
});

document.querySelector(".keypress-listener").addEventListener("keypress", (event) => {
	event.preventDefault();
});

function init() {
    resize();
    pointer.x = canvas.width/2;
    pointer.y = canvas.height/2;

    for(var i=0; i<MAX_PARTICLES/2; i++) {
        var theta = 2*Math.PI*Math.random();
        var radius = 100+(dim.MAX_DIM/2-100)*Math.random();
        var vOrbit = Math.sqrt(G*pointer.m/radius);    // v_orbit = sqrt(G*M/r)
        particles.push(new Particle(
            canvas.width/2+radius*Math.cos(theta),
            canvas.height/2+radius*Math.sin(theta),
            vOrbit*Math.cos(theta+Math.PI/2),
            vOrbit*Math.sin(theta+Math.PI/2),
            2,
            Math.random()
        ));
    }

    lastDraw = Date.now();
    drawId = requestAnimationFrame(draw);
    lastTick = Date.now();
    tickId = setTimeout(tick,1000/tps);
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

  for(var i=0; i<particles.length; i++) {
    var p = particles[i];
        var path = p.path;
        var color = p.color.copy();
        color.a = 0.5;

        if(prettyPath) {
            ctx.fillStyle = color.toString();
            ctx.beginPath();
            for(var j=path.length-1; j>0; j--) {
        var dx = path[j-1].x-path[j].x;
        var dy = path[j-1].y-path[j].y;
        var dist = Math.sqrt(dx*dx+dy*dy);
                var spread = p.r/2*(j-1)/(path.length-1);
                if(j==path.length-1) {
                    ctx.moveTo(path[j].x-spread*dy/dist,path[j].y+spread*dx/dist);
                } else {
                    ctx.lineTo(path[j-1].x-spread*dy/dist,path[j-1].y+spread*dx/dist);
                }
            }
            for(var j=1; j<path.length; j++) {
        var dx = path[j].x-path[j-1].x;
        var dy = path[j].y-path[j-1].y;
        var dist = Math.sqrt(dx*dx+dy*dy);
                var spread = p.r/2*(j-1)/(path.length-1);
                ctx.lineTo(path[j].x-spread*dy/dist,path[j].y+spread*dx/dist);
            }
            ctx.fill();
        } else {
            ctx.strokeStyle = color.toString();
            ctx.beginPath();
            for(var j=1; j<path.length; j++) {
                if(j==1) {
                    ctx.moveTo(path[j-1].x,path[j-1].y);
                }
                ctx.lineTo(path[j].x,path[j].y);
            }
            ctx.stroke();
        }
    }
  for(var i=0; i<particles.length; i++) {
    var p = particles[i];
        ctx.fillStyle = p.color.toHex();
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
        ctx.fill();
  }

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(pointer.x,pointer.y,pointer.r,0,2*Math.PI);
    ctx.fill();

    lastDraw = Date.now();
    drawId = requestAnimationFrame(draw);
}

function tick() {
    var currentTick = Date.now();
    var dt = (currentTick-lastTick)/1000;

  if(pointer.isDown&&Date.now()-pointer.moveT>=300&&particles.length<MAX_PARTICLES) {
    var theta = 2*Math.PI*Math.random();
    var radius = 100+200*Math.random();
    var vOrbit = Math.sqrt(G*pointer.m/radius);    // v_orbit = sqrt(G*M/r)
    particles.push(new Particle(
      pointer.x+radius*Math.cos(theta),
      pointer.y+radius*Math.sin(theta),
      vOrbit*Math.cos(theta+Math.PI/2),
      vOrbit*Math.sin(theta+Math.PI/2),
      2,
      Math.random()
    ));
  }

    // gravitate
  // maybe find center of mass and gravitate toward that for O(n)
  var nextParticles = [];
  for(var i=0; i<particles.length; i++) {
    var p1 = particles[i].copy();
    var netAcc = {x:0,y:0};
    for(var j=0; j<=particles.length; j++) {
      if(i!=j) {
        var p2 = (j<particles.length)?particles[j]:pointer;
        var acc = p1.gravitateTo(p2,dt);
        netAcc.x+=acc.x;
        netAcc.y+=acc.y;
      }
    }
    p1.update(netAcc,dt);

    if(p1.x+p1.r>=dim.minX&&p1.x-p1.r<=dim.maxX&&p1.y+p1.r>=dim.minY&&p1.y-p1.r<=dim.maxY) {
      nextParticles.push(p1);
    }
  }
  // collide
  for(var i=-1; i<nextParticles.length-1; i++) {
    var p1 = (i>=0)?nextParticles[i]:pointer;
    for(var j=i+1; j<nextParticles.length; j++) {
      var p2 = nextParticles[j];
      var dx = p2.x-p1.x;
      var dy = p2.y-p1.y;
      var dist = Math.sqrt(dx*dx+dy*dy);
      if(dist<p1.r+p2.r) {
        if(i>=0) {
          p1 = p1.collide(p2);
        } else {
          p1.m+=p2.m;
        }
        nextParticles.splice(j,1);
        j--;
      }
    }
    nextParticles[i] = p1;
  }
  particles = nextParticles;

    lastTick = currentTick;
    tickId = setTimeout(tick,1000/tps);
}

function Particle(x,y,vx,vy,r,cid) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.ax = 0;
    this.ay = 0;
    this.r = r;
  this.m = r*r/200;  // so that if r=10, m=0.5
    this.path = [{x:x,y:y}];
  this.color = rainbow.getColorAt(cid);
    this.colorId = cid;
  this.copy = function() {
    var p = new Particle(this.x,this.y,this.vx,this.vy,this.r,this.colorId);
    p.path = this.path;
    return p;
  };
  this.gravitateTo = function(p,dt) {
        var dx = p.x-this.x;
        var dy = p.y-this.y;
        var dist = Math.sqrt(dx*dx+dy*dy);

        var acc =  G*p.m/Math.pow(dist,2);    // a_g = G*M/r^2
    return {
      x: acc*dx/dist,
      y: acc*dy/dist
    };
  };
  this.update = function(acc,dt) {
        if(this.path.length>1/dt) {    // 1s history
            this.path.shift();
        }

        this.ax = acc.x;
        this.ay = acc.y;
        this.vx += this.ax*dt;
        this.vy += this.ay*dt;
        this.x += this.vx*dt;
        this.y += this.vy*dt;

        this.path.push({
            x: this.x,
            y: this.y
        });
  };
  this.collide = function(p) {
    var totalMass = this.m+p.m;
    var x = (this.m*this.x+p.m*p.x)/totalMass;
    var y = (this.m*this.y+p.m*p.y)/totalMass;
    var vx = (this.m*this.vx+p.m*p.vx)/totalMass;
    var vy = (this.m*this.vy+p.m*p.vy)/totalMass;
    var r = Math.sqrt(200*totalMass);
    var m = totalMass;

    var colorId = cyclicWeightedMean(this.colorId,p.colorId,this.m,p.m);
    return new Particle(x,y,vx,vy,r,colorId);
  };
}

// returns fractional part of number
function fPart(a) {
  return a-Math.floor(a);
}

// weighted average in the cycle [0,1)
function cyclicWeightedMean(a,b,wa,wb) {
  var h = Math.abs(a-b)<0.5 ? a : b;
  a = fPart(a-h);
  b = fPart(b-h);
  return fPart(h+(wa*a+wb*b)/(wa+wb));
}
