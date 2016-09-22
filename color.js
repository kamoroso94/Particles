"use strict";

var Color = {
	RGBA: function(r,g,b,a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		this.toString = function() {
			return "rgba("+this.r+","+this.g+","+this.b+","+this.a+")";
		};
		this.toInteger = function() {
			return this.r<<24|this.g<<16|this.b<<8|Math.floor(255*this.a);
		};
		this.toRGB = function() {
			return "rgb("+this.r+","+this.g+","+this.b+")";
		};
		this.toHex = function() {
			return "#"+("00000"+(this.toInteger()>>>8).toString(16)).slice(-6);
		};
		this.copy = function() {
			return new Color.RGBA(this.r,this.g,this.b,this.a);
		};
	},
	Gradient: function(colors) {
		this.colors = [];
		//this.stops = stops;
		for(var i=0; i<colors.length; i++) {
			var color = colors[i];
			if(color instanceof Color.RGBA) {
				color = color.copy();
			} else {
				color = Color.parseColor(color);
			}
			if(color!=null) {
				this.colors.push(color);
			}
		}
		
		this.getColorAt = function(offset) {
			offset = parseFloat(offset);
			if(isNaN(offset)||Math.floor(offset)!=0) {
				return null;
			}
			var index = this.colors.length*offset;
			var lowerBound = this.colors[Math.floor(index)];
			var upperBound = this.colors[Math.ceil(index)%this.colors.length];
			var fPart = index%1;	// input guarenteed to be positive
			
			var r = Math.round(upperBound.r*fPart+lowerBound.r*(1-fPart));
			var g = Math.round(upperBound.g*fPart+lowerBound.g*(1-fPart));
			var b = Math.round(upperBound.b*fPart+lowerBound.b*(1-fPart));
			var a = Math.round(upperBound.a*fPart+lowerBound.a*(1-fPart));
			
			return new Color.RGBA(r,g,b,a);
		};
	},
	parseColor: function(color) {
		var rgba = [];
		if(typeof color!="string") {
			return null;
		}
		if(color.substr(0,3)=="rgb") {
			var index = 5;
			if(color.charAt(3)!="a") {
				index--;
			}
			color = color.slice(index,-1);
			color.split(",").forEach(function(channel,i) {
				var value = (i<3)?Math.max(0,Math.min(parseInt(channel),255)):Math.max(0,Math.min(parseFloat(channel),1));
				if(isNaN(value)) {
					return null;
				}
				rgba.push(value);
			});
			if(rgba.length==3) {
				rgba.push(1);
			}
			if(rgba.length!=4) {
				return null;
			}
			return new Color.RGBA(rgba[0],rgba[1],rgba[2],rgba[3]);
		} else if(color.charAt(0)=="#") {
			color = color.substr(1);
			if(color.length!=3&&color.length!=6) {
				return null;
			}
			for(var i=0; i<3; i++) {
				var hex,value;
				if(color.length==3) {
					hex = color.charAt(i);
					hex+=hex;
				} else {
					hex = color.substr(2*i,2);
				}
				value = parseInt(hex,16);
				if(isNaN(value)) {
					return null;
				}
				rgba.push(value);
			}
			return new Color.RGBA(rgba[0],rgba[1],rgba[2],1);
		} else {
			return null;
		}
	},
	random: function(gradient) {
		if(gradient instanceof Color.Gradient) {
			return gradient.getColorAt(Math.random());
		} else {
			var r = Math.floor(256*Math.random());
			var g = Math.floor(256*Math.random());
			var b = Math.floor(256*Math.random());
			return new Color.RGBA(r,g,b,1);
		}
	}
};