/// --------------------- ///
/// 2014.10.11-14 BY DRCZ ///
/// --------------------- ///

var screen_w=640, screen_h=480;
var kanwa=document.getElementById("ekraniszcze");
var kontekst=kanwa.getContext("2d");


/// graphics ///

loadImage=function(url){
    var i=new Image();
    i.src=url;
    return(i);
};

var Sprites = {'HERO': loadImage('img/robot32.png'),
	       'WALL': loadImage('img/sciana32.png'),
	       'CRATE': loadImage('img/skrzynia32.png'),
	       'LEADENCRATE': loadImage('img/olowiana-skrzynia32.png'),
	       'BOMB': loadImage('img/bomba32.png'),
	       'DETONATOR': loadImage('img/detonator32.png'),
	       'FIRE': loadImage('img/wybuch32.png'),
	       'BDOOR': loadImage('img/drzwi32.png'),
	       'DOOR': loadImage('img/drzwi32.png'),
	       'KEY': loadImage('img/klucz32.png'),
	       'TELEPORT': loadImage('img/teleport32.png'),
	       'GUN-L': loadImage('img/dzialo-l32.png'),
	       'GUN-R': loadImage('img/dzialo-p32.png'),
	       'GUN-U': loadImage('img/dzialo-g32.png'),
	       'GUN-D': loadImage('img/dzialo-d32.png'),
	       'PARTICLE': loadImage('img/czastka32.png'),
	       'URMIRROR': loadImage('img/lustro-pg32.png'),
	       'ANT': {'up':loadImage('img/mrowka-g32.png'),
		       'down':loadImage('img/mrowka-d32.png'),
		       'left':loadImage('img/mrowka-l32.png'),
		       'right':loadImage('img/mrowka-p32.png')},

	       '?': loadImage('img/pytajnik32.png')
	      };


/// LEVEL: /////////////////////////////////////////////

find_by_id = function(level, o_id) {
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	if(object.id == o_id) return(object);
    }
    return(null);
};

find_by_pos = function(level, x, y) {
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	if(object.x == x && object.y == y) return(object);
    }
    return(null);
};

clean_up = function(level) {
    var new_objects = [];
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	new_objects.push(object);
    }
    level.objects = new_objects;
    return(level);
};

update_object = function(level, o_id, obj) {
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	if(object.id == o_id) {
	    level.objects[i] = obj;
	    break;
	}
    }
    return(level);
};

delete_object = function(level, o_id) {
    level = update_object(level, o_id, null);
    return(level);
};

spawn_object = function(level, obj, anyway) {
    var id = 0;
    var already_something = find_by_pos(level, obj.x, obj.y);
    if(!anyway && already_something != null) return(level);
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	if(object.id >= id) id = object.id;
    }
    id++; /// next free id
    obj.id = id;
    level.objects.push(obj);
    return(level);
};


move_object = function(level, o_id, nx, ny) {
    //console.log('move '+o_id+' to '+nx+','+ny);
    var o1 = find_by_id(level, o_id);
    var o2 = find_by_pos(level, nx, ny);
    if(o1 == null) {
	level = level;
    } else if(o2 == null) {
	//console.log('free tile');
	o1.x = nx;
	o1.y = ny;
	level = update_object(level, o_id, o1);
    } else {
	//console.log('collision of '+o1.type+' with '+o2.type);
	level = collision(level, o1.id, o2.id);
    }    
    return(level);
};

new_fire = function(x, y, expires) {
    return({
	'id': -1,
	'type': 'FIRE',
	'x': x,
	'y': y,
	'dx': 0,
	'dy': 0,
	'expires': expires
    });
};

/*
new_wall = function(x, y) {
    return({
	'id': -1,
	'type': 'WALL',
	'x': x,
	'y': y,
	'dx': 0,
	'dy': 0	
    });
};*/

new_particle = function(x, y, dx, dy) {
    return({
	'id': -1,
	'type': 'PARTICLE',
	'x': x,
	'y': y,
	'dx': dx,
	'dy': dy
    });
};


explosion = function(level, x, y, r) {   
    if(r==0) { /// very tiny one
	var obj = find_by_pos(level, x, y);
	if(obj != null && obj.type!='WALL') {
	    level = delete_object(level, obj.id);
	}
	if(obj == null || obj.type!='WALL') {
	    level = spawn_object(level, new_fire(x, y, 1), false);
	}
	return(level);
    }   
    /// else 
    for(var i=-r;i<=r;i++) {
	for(var j=-r;j<=r;j++) {
	    var obj = find_by_pos(level, x+i, y+j);
	    /// todo: różne rzeczy będą różnie wybuchały...
	    if(obj != null && obj.type!='WALL') {
		level = delete_object(level, obj.id);
	    }
	    if(obj == null || obj.type!='WALL') {
		level = spawn_object(level, new_fire(x+i, y+j, 2), false);
	    }
	}
    }
    return(level);
};

signum = function(x) {
    if(x<0) return -1;
    else if(x==0) return 0;
    else return 1;
};

collision = function(level, o1_id, o2_id) {
    var o1 = find_by_id(level, o1_id);
    var o2 = find_by_id(level, o2_id);    
    /// " assert(o1!=null && o2!=null) "
    switch(o1.type) {

    case 'HERO':
	switch(o2.type) {
	case 'CRATE':
	case 'LEADENCRATE':
	case 'URMIRROR':
	case 'BOMB':
	    var x = o2.x;
	    var y = o2.y;
	    var dx = signum(o2.x-o1.x);
	    var dy = signum(o2.y-o1.y);
	    level = move_object(level, o2_id, x+dx, y+dy);
	    var is_it_still_there = find_by_pos(level,x,y);
	    if(is_it_still_there == null) {
		o1.x = x;
		o1.y = y;
		level = update_object(level, o1.id, o1);
	    } else {
		level = level;
	    }
	    break;

	case 'KEY':
	    level = delete_object(level, o2.id);
	    level.state.keys++;
	    break;

	case 'DOOR':
	    if(level.state.keys>0) {
		level = delete_object(level, o2.id);
		level.state.keys--;
	    }
	    break;

	case 'TELEPORT':
	    level = move_object(level, o1.id, o2.destx+o1.dx, o2.desty+o1.dy);
	    break;

	case 'DETONATOR':
	    var bomb = find_by_id(level, o2.bomb);
	    level = delete_object(level, o2.id);
	    if(bomb != null) {
		level = delete_object(level, bomb.id); /// niepotrzebnie?
		level = explosion(level, bomb.x, bomb.y, 1);
	    }
	    break;
	    
	case 'FIRE':
	case 'PARTICLE':
	    level = explosion(level, o1.x, o1.y, 0);
	    break;

	default:
	    level = level;
	}
	break;

    case 'ANT':
	switch(o2.type) {
	case 'HERO':
	    level = explosion(level, o2.x, o2.y, 0);
	    break;

	case 'PARTICLE':
	case 'FIRE':
	    //level = explosion(level, o1.x, o1.y, 0);
	    level = delete_object(level, o1.id);
	    break;

	default:
	    var tmp = o1.dx;
	    o1.dx = -o1.dy;
	    o1.dy = tmp;
	    level = update_object(level, o1.id, o1);
	}
	break;

    case 'PARTICLE':
	switch(o2.type) {

///	case 'HERO': /// tmp muka
///	    break; 

	case 'URMIRROR':
	    var dx = signum(o2.x-o1.x);
	    var dy = signum(o2.y-o1.y);
	    if(dx==-1) { // z prawej
		o1.dx = 0;
		o1.dy = -1;
		level = update_object(level, o1.id, o1);
		level = move_object(level, o1.id, o2.x,o2.y-1);
	    } else if(dy==1) { // z gory
		o1.dx = 1;
		o1.dy = 0;
		level = update_object(level, o1.id, o1);
		level = move_object(level, o1.id, o2.x+1, o2.y);
	    }
	    break;

	case 'WALL':
	case 'LEADENCRATE':
	    level = delete_object(level, o1.id);
	    level = explosion(level, o1.x, o1.y, 0);
	    break;

	case 'FIRE':
	    level = delete_object(level, o1.id);
	    break;

	case 'BOMB':
	    level = explosion(level, o2.x, o2.y,1);
	    break;

	default:
	    level = delete_object(level, o2.id);
	    level = explosion(level, o1.x, o1.y, 0);
	}
	break;

    case 'CRATE':
	switch(o2.type) {
	case 'CRATE':
	    var x = o2.x;
	    var y = o2.y;
	    var dx = signum(o2.x-o1.x);
	    var dy = signum(o2.y-o1.y);
	    level = move_object(level, o2_id, x+dx, y+dy);
	    var is_it_still_there = find_by_pos(level,x,y);
	    if(is_it_still_there == null) {
		o1.x = x;
		o1.y = y;
		level = update_object(level, o1.id, o1);
	    } else {
		level = level;
	    }
	    break;

	case 'TELEPORT':
	    var dx = signum(o2.x-o1.x);
	    var dy = signum(o2.y-o1.y);
	    level = move_object(level, o1.id, o2.destx+dx, o2.desty+dy);
	    break;

	case 'DETONATOR':
	    var bomb = find_by_id(level, o2.bomb);
	    if(bomb != null) {
		level = delete_object(level, bomb.id); /// niepotrzebnie?
		level = explosion(level, bomb.x, bomb.y, 1);
	    }
	    break;


	}
	break;

    default:
	level = level;
    }
    return(level);
};

/// TMP /////////////////////////////

/*
ascii_level = function(level) { /// tmp
    var tablica=function(sze,wys,init) {
	var t=[];
	for(i=0;i<wys;i++) {
	    t[i]=[];
	    for(j=0;j<sze;j++) t[i][j]=init;
	}
	return(t);
    };    
    var h=10;
    var w=15;
    var l = tablica(h,w,'.');
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	var x=object.x;
	var y=object.y;
	switch(object.type) {
	case 'KEY': l[x][y] = 'k'; break;
	case 'HERO': l[x][y] = '@'; break;
	case 'WALL': l[x][y] = '#'; break;
	case 'CRATE': l[x][y] = 'X'; break;	   
	case 'DOOR': l[x][y] = 'D'; break;
	case 'BOMB': l[x][y] = 'b'; break;
	case 'DETONATOR': l[x][y] = 'd'; break;
	case 'FIRE': l[x][y] = ''+object.expires;
	default: l[x][y] = '?';
	}	
    }
    for(var i=0;i<h;i++) {
	var s='';
	for(var j=0;j<w;j++) {
	    s=s+l[j][i];	    
	}
	console.log(s);
    }
    return(level.state);
};
*/


/// DEMO 1 LEVEL ///

load_level = function() {
    return(
	{
	    'objects':	   
	    [
		{'id': 0, 'type':'HERO', 'x': 8, 'y': 1, 'dx':0, 'dy':0},
		{'id': 1, 'type':'WALL', 'x': 0, 'y': 1, 'dx':0, 'dy':0},
		{'id': 2, 'type':'WALL', 'x': 0, 'y': 2, 'dx':0, 'dy':0},
		{'id': 3, 'type':'WALL', 'x': 0, 'y': 3, 'dx':0, 'dy':0},
		{'id': 4, 'type':'WALL', 'x': 0, 'y': 4, 'dx':0, 'dy':0},
		{'id': 5, 'type':'WALL', 'x': 0, 'y': 5, 'dx':0, 'dy':0},
		{'id': 6, 'type':'WALL', 'x': 0, 'y': 6, 'dx':0, 'dy':0},
		{'id': 7, 'type':'WALL', 'x': 0, 'y': 7, 'dx':0, 'dy':0},
		{'id': 8, 'type':'WALL', 'x': 0, 'y': 8, 'dx':0, 'dy':0},
		{'id': 9, 'type':'WALL', 'x': 0, 'y': 14, 'dx':0, 'dy':0},
		{'id': 10, 'type':'WALL', 'x': 0, 'y': 15, 'dx':0, 'dy':0},
		{'id': 11, 'type':'WALL', 'x': 0, 'y': 16, 'dx':0, 'dy':0},
		{'id': 12, 'type':'WALL', 'x': 0, 'y': 17, 'dx':0, 'dy':0},
		{'id': 13, 'type':'WALL', 'x': 0, 'y': 18, 'dx':0, 'dy':0},
		{'id': 14, 'type':'WALL', 'x': 0, 'y': 19, 'dx':0, 'dy':0},
		{'id': 15, 'type':'WALL', 'x': 0, 'y': 20, 'dx':0, 'dy':0},
		{'id': 16, 'type':'WALL', 'x': 1, 'y': 1, 'dx':0, 'dy':0},
		{'id': 17, 'type':'LEADENCRATE', 'x': 1, 'y': 2, 'dx':0, 'dy':0},
		{'id': 18, 'type':'GUN-U', 'x': 1, 'y': 7, 'dx':0, 'dy':0, 'count':0, 'maxcount':4},
		{'id': 19, 'type':'WALL', 'x': 1, 'y': 8, 'dx':0, 'dy':0},
		{'id': 20, 'type':'WALL', 'x': 1, 'y': 13, 'dx':0, 'dy':0},
		{'id': 21, 'type':'WALL', 'x': 1, 'y': 14, 'dx':0, 'dy':0},
		{'id': 22, 'type':'GUN-D', 'x': 1, 'y': 15, 'dx':0, 'dy':0, 'count':0, 'maxcount':5},
		{'id': 23, 'type':'WALL', 'x': 1, 'y': 20, 'dx':0, 'dy':0},
		{'id': 24, 'type':'WALL', 'x': 2, 'y': 0, 'dx':0, 'dy':0},
		{'id': 25, 'type':'WALL', 'x': 2, 'y': 1, 'dx':0, 'dy':0},
		{'id': 26, 'type':'CRATE', 'x': 2, 'y': 2, 'dx':0, 'dy':0},
		{'id': 27, 'type':'WALL', 'x': 2, 'y': 3, 'dx':0, 'dy':0},
		{'id': 28, 'type':'WALL', 'x': 2, 'y': 4, 'dx':0, 'dy':0},
		{'id': 29, 'type':'WALL', 'x': 2, 'y': 8, 'dx':0, 'dy':0},
		{'id': 30, 'type':'WALL', 'x': 2, 'y': 9, 'dx':0, 'dy':0},
		{'id': 31, 'type':'WALL', 'x': 2, 'y': 12, 'dx':0, 'dy':0},
		{'id': 32, 'type':'WALL', 'x': 2, 'y': 13, 'dx':0, 'dy':0},
		{'id': 33, 'type':'URMIRROR', 'x': 2, 'y': 19, 'dx':0, 'dy':0},
		{'id': 34, 'type':'WALL', 'x': 2, 'y': 20, 'dx':0, 'dy':0},
		{'id': 35, 'type':'WALL', 'x': 2, 'y': 21, 'dx':0, 'dy':0},
		{'id': 36, 'type':'WALL', 'x': 3, 'y': 0, 'dx':0, 'dy':0},
		{'id': 37, 'type':'CRATE', 'x': 3, 'y': 1, 'dx':0, 'dy':0},
		{'id': 38, 'type':'WALL', 'x': 3, 'y': 4, 'dx':0, 'dy':0},
		{'id': 39, 'type':'BOMB', 'x': 3, 'y': 6, 'dx':0, 'dy':0},
		{'id': 40, 'type':'WALL', 'x': 3, 'y': 8, 'dx':0, 'dy':0},
		{'id': 41, 'type':'WALL', 'x': 3, 'y': 9, 'dx':0, 'dy':0},
		{'id': 42, 'type':'WALL', 'x': 3, 'y': 10, 'dx':0, 'dy':0},
		{'id': 43, 'type':'WALL', 'x': 3, 'y': 12, 'dx':0, 'dy':0},
		{'id': 44, 'type':'TELEPORT', 'x': 3, 'y': 13, 'dx':0, 'dy':0, 'destx':19, 'desty':13},
		{'id': 45, 'type':'CRATE', 'x': 3, 'y': 19, 'dx':0, 'dy':0},
		{'id': 46, 'type':'WALL', 'x': 3, 'y': 21, 'dx':0, 'dy':0},
		{'id': 47, 'type':'WALL', 'x': 3, 'y': 22, 'dx':0, 'dy':0},
		{'id': 48, 'type':'WALL', 'x': 4, 'y': 0, 'dx':0, 'dy':0},
		{'id': 49, 'type':'CRATE', 'x': 4, 'y': 1, 'dx':0, 'dy':0},
		{'id': 50, 'type':'CRATE', 'x': 4, 'y': 4, 'dx':0, 'dy':0},
		{'id': 51, 'type':'CRATE', 'x': 4, 'y': 9, 'dx':0, 'dy':0},
		{'id': 52, 'type':'WALL', 'x': 4, 'y': 10, 'dx':0, 'dy':0},
		{'id': 53, 'type':'WALL', 'x': 4, 'y': 12, 'dx':0, 'dy':0},
		{'id': 54, 'type':'WALL', 'x': 4, 'y': 13, 'dx':0, 'dy':0},
		{'id': 55, 'type':'WALL', 'x': 4, 'y': 14, 'dx':0, 'dy':0},
		{'id': 56, 'type':'WALL', 'x': 4, 'y': 15, 'dx':0, 'dy':0},
		{'id': 57, 'type':'WALL', 'x': 4, 'y': 16, 'dx':0, 'dy':0},
		{'id': 58, 'type':'WALL', 'x': 4, 'y': 17, 'dx':0, 'dy':0},
		{'id': 59, 'type':'WALL', 'x': 4, 'y': 18, 'dx':0, 'dy':0},
		{'id': 60, 'type':'WALL', 'x': 4, 'y': 22, 'dx':0, 'dy':0},
		{'id': 61, 'type':'WALL', 'x': 5, 'y': 0, 'dx':0, 'dy':0},
		{'id': 62, 'type':'LEADENCRATE', 'x': 5, 'y': 2, 'dx':0, 'dy':0},
		{'id': 63, 'type':'WALL', 'x': 5, 'y': 4, 'dx':0, 'dy':0},
		{'id': 64, 'type':'DETONATOR', 'x': 5, 'y': 5, 'dx':0, 'dy':0, 'bomb': 39},
		{'id': 65, 'type':'WALL', 'x': 5, 'y': 8, 'dx':0, 'dy':0},
		{'id': 66, 'type':'CRATE', 'x': 5, 'y': 9, 'dx':0, 'dy':0},
		{'id': 67, 'type':'WALL', 'x': 5, 'y': 10, 'dx':0, 'dy':0},
		{'id': 68, 'type':'WALL', 'x': 5, 'y': 12, 'dx':0, 'dy':0},
		{'id': 69, 'type':'WALL', 'x': 5, 'y': 18, 'dx':0, 'dy':0},
		{'id': 70, 'type':'WALL', 'x': 5, 'y': 22, 'dx':0, 'dy':0},
		{'id': 71, 'type':'WALL', 'x': 6, 'y': 0, 'dx':0, 'dy':0},
		{'id': 72, 'type':'WALL', 'x': 6, 'y': 2, 'dx':0, 'dy':0},
		{'id': 73, 'type':'WALL', 'x': 6, 'y': 3, 'dx':0, 'dy':0},
		{'id': 74, 'type':'WALL', 'x': 6, 'y': 4, 'dx':0, 'dy':0},
		{'id': 75, 'type':'WALL', 'x': 6, 'y': 5, 'dx':0, 'dy':0},
		{'id': 76, 'type':'WALL', 'x': 6, 'y': 6, 'dx':0, 'dy':0},
		{'id': 77, 'type':'WALL', 'x': 6, 'y': 8, 'dx':0, 'dy':0},
		{'id': 78, 'type':'KEY', 'x': 6, 'y': 9, 'dx':0, 'dy':0},
		{'id': 79, 'type':'WALL', 'x': 6, 'y': 10, 'dx':0, 'dy':0},
		{'id': 80, 'type':'WALL', 'x': 6, 'y': 12, 'dx':0, 'dy':0},
		{'id': 81, 'type':'DOOR', 'x': 6, 'y': 18, 'dx':0, 'dy':0},
		{'id': 82, 'type':'LEADENCRATE', 'x': 6, 'y': 20, 'dx':0, 'dy':0},
		{'id': 83, 'type':'WALL', 'x': 6, 'y': 22, 'dx':0, 'dy':0},
		{'id': 84, 'type':'WALL', 'x': 7, 'y': 0, 'dx':0, 'dy':0},
		{'id': 85, 'type':'WALL', 'x': 7, 'y': 2, 'dx':0, 'dy':0},
		{'id': 86, 'type':'LEADENCRATE', 'x': 7, 'y': 3, 'dx':0, 'dy':0},
		{'id': 87, 'type':'WALL', 'x': 7, 'y': 6, 'dx':0, 'dy':0},
		{'id': 88, 'type':'CRATE', 'x': 7, 'y': 7, 'dx':0, 'dy':0},
		{'id': 89, 'type':'WALL', 'x': 7, 'y': 8, 'dx':0, 'dy':0},
		{'id': 90, 'type':'WALL', 'x': 7, 'y': 10, 'dx':0, 'dy':0},
		{'id': 91, 'type':'WALL', 'x': 7, 'y': 12, 'dx':0, 'dy':0},
		{'id': 92, 'type':'GUN-D', 'x': 7, 'y': 13, 'dx':0, 'dy':0, 'count':0, 'maxcount':3},
		{'id': 93, 'type':'WALL', 'x': 7, 'y': 18, 'dx':0, 'dy':0},
		{'id': 94, 'type':'WALL', 'x': 7, 'y': 22, 'dx':0, 'dy':0},
		{'id': 95, 'type':'WALL', 'x': 8, 'y': 0, 'dx':0, 'dy':0},
		{'id': 96, 'type':'WALL', 'x': 8, 'y': 2, 'dx':0, 'dy':0},
		{'id': 97, 'type':'BDOOR', 'x': 8, 'y': 6, 'dx':0, 'dy':0},
		{'id': 98, 'type':'WALL', 'x': 8, 'y': 10, 'dx':0, 'dy':0},
		{'id': 99, 'type':'WALL', 'x': 8, 'y': 12, 'dx':0, 'dy':0},
		{'id': 100, 'type':'WALL', 'x': 8, 'y': 13, 'dx':0, 'dy':0},
		{'id': 101, 'type':'GUN-D', 'x': 8, 'y': 14, 'dx':0, 'dy':0, 'count':0, 'maxcount':3},
		{'id': 102, 'type':'WALL', 'x': 8, 'y': 18, 'dx':0, 'dy':0},
		{'id': 103, 'type':'WALL', 'x': 8, 'y': 21, 'dx':0, 'dy':0},
		{'id': 104, 'type':'WALL', 'x': 8, 'y': 22, 'dx':0, 'dy':0},
		{'id': 105, 'type':'WALL', 'x': 9, 'y': 0, 'dx':0, 'dy':0},
		{'id': 106, 'type':'WALL', 'x': 9, 'y': 2, 'dx':0, 'dy':0},
		{'id': 107, 'type':'TELEPORT', 'x': 9, 'y': 3, 'dx':0, 'dy':0, 'destx':16, 'desty':4},
		{'id': 108, 'type':'WALL', 'x': 9, 'y': 6, 'dx':0, 'dy':0},
		{'id': 109, 'type':'CRATE', 'x': 9, 'y': 7, 'dx':0, 'dy':0},
		{'id': 110, 'type':'WALL', 'x': 9, 'y': 8, 'dx':0, 'dy':0},
		{'id': 111, 'type':'WALL', 'x': 9, 'y': 9, 'dx':0, 'dy':0},
		{'id': 112, 'type':'WALL', 'x': 9, 'y': 10, 'dx':0, 'dy':0},
		{'id': 113, 'type':'WALL', 'x': 9, 'y': 13, 'dx':0, 'dy':0},
		{'id': 114, 'type':'WALL', 'x': 9, 'y': 14, 'dx':0, 'dy':0},
		{'id': 115, 'type':'GUN-D', 'x': 9, 'y': 15, 'dx':0, 'dy':0, 'count':0, 'maxcount':3},
		{'id': 116, 'type':'WALL', 'x': 9, 'y': 18, 'dx':0, 'dy':0},
		{'id': 117, 'type':'WALL', 'x': 9, 'y': 21, 'dx':0, 'dy':0},
		{'id': 118, 'type':'WALL', 'x': 10, 'y': 0, 'dx':0, 'dy':0},
		{'id': 119, 'type':'WALL', 'x': 10, 'y': 1, 'dx':0, 'dy':0},
		{'id': 120, 'type':'WALL', 'x': 10, 'y': 2, 'dx':0, 'dy':0},
		{'id': 121, 'type':'WALL', 'x': 10, 'y': 6, 'dx':0, 'dy':0},
		{'id': 122, 'type':'WALL', 'x': 10, 'y': 8, 'dx':0, 'dy':0},
		{'id': 123, 'type':'WALL', 'x': 10, 'y': 14, 'dx':0, 'dy':0},
		{'id': 124, 'type':'WALL', 'x': 10, 'y': 15, 'dx':0, 'dy':0},
		{'id': 125, 'type':'GUN-D', 'x': 10, 'y': 16, 'dx':0, 'dy':0, 'count':0, 'maxcount':3},
		{'id': 126, 'type':'WALL', 'x': 10, 'y': 18, 'dx':0, 'dy':0},
		{'id': 127, 'type':'WALL', 'x': 10, 'y': 20, 'dx':0, 'dy':0},
		{'id': 128, 'type':'WALL', 'x': 10, 'y': 21, 'dx':0, 'dy':0},
		{'id': 129, 'type':'WALL', 'x': 11, 'y': 2, 'dx':0, 'dy':0},
		{'id': 130, 'type':'WALL', 'x': 11, 'y': 3, 'dx':0, 'dy':0},
		{'id': 131, 'type':'GUN-L', 'x': 11, 'y': 4, 'dx':0, 'dy':0, 'count':2, 'maxcount':5},
		{'id': 132, 'type':'GUN-L', 'x': 11, 'y': 5, 'dx':0, 'dy':0, 'count':3, 'maxcount':5},
		{'id': 133, 'type':'WALL', 'x': 11, 'y': 6, 'dx':0, 'dy':0},
		{'id': 134, 'type':'WALL', 'x': 11, 'y': 7, 'dx':0, 'dy':0},
		{'id': 135, 'type':'WALL', 'x': 11, 'y': 8, 'dx':0, 'dy':0},
		{'id': 136, 'type':'WALL', 'x': 11, 'y': 10, 'dx':0, 'dy':0},
		{'id': 137, 'type':'WALL', 'x': 11, 'y': 11, 'dx':0, 'dy':0},
		{'id': 138, 'type':'WALL', 'x': 11, 'y': 12, 'dx':0, 'dy':0},
		{'id': 139, 'type':'WALL', 'x': 11, 'y': 15, 'dx':0, 'dy':0},
		{'id': 140, 'type':'WALL', 'x': 11, 'y': 16, 'dx':0, 'dy':0},
		{'id': 141, 'type':'WALL', 'x': 11, 'y': 17, 'dx':0, 'dy':0},
		{'id': 142, 'type':'WALL', 'x': 11, 'y': 18, 'dx':0, 'dy':0},
		{'id': 143, 'type':'DOOR', 'x': 11, 'y': 19, 'dx':0, 'dy':0},
		{'id': 144, 'type':'WALL', 'x': 11, 'y': 20, 'dx':0, 'dy':0},
		{'id': 145, 'type':'WALL', 'x': 12, 'y': 3, 'dx':0, 'dy':0},
		{'id': 146, 'type':'WALL', 'x': 12, 'y': 4, 'dx':0, 'dy':0},
		{'id': 147, 'type':'WALL', 'x': 12, 'y': 5, 'dx':0, 'dy':0},
		{'id': 148, 'type':'WALL', 'x': 12, 'y': 6, 'dx':0, 'dy':0},
		{'id': 149, 'type':'WALL', 'x': 12, 'y': 10, 'dx':0, 'dy':0},
		{'id': 150, 'type':'KEY', 'x': 12, 'y': 11, 'dx':0, 'dy':0},
		{'id': 151, 'type':'WALL', 'x': 12, 'y': 12, 'dx':0, 'dy':0},
		{'id': 152, 'type':'WALL', 'x': 12, 'y': 17, 'dx':0, 'dy':0},
		{'id': 153, 'type':'WALL', 'x': 12, 'y': 18, 'dx':0, 'dy':0},
		{'id': 154, 'type':'WALL', 'x': 12, 'y': 20, 'dx':0, 'dy':0},
		{'id': 155, 'type':'WALL', 'x': 13, 'y': 10, 'dx':0, 'dy':0},
		{'id': 156, 'type':'WALL', 'x': 13, 'y': 12, 'dx':0, 'dy':0},
		{'id': 157, 'type':'WALL', 'x': 13, 'y': 18, 'dx':0, 'dy':0},
		{'id': 158, 'type':'WALL', 'x': 13, 'y': 20, 'dx':0, 'dy':0},
		{'id': 159, 'type':'WALL', 'x': 14, 'y': 3, 'dx':0, 'dy':0},
		{'id': 160, 'type':'WALL', 'x': 14, 'y': 4, 'dx':0, 'dy':0},
		{'id': 161, 'type':'WALL', 'x': 14, 'y': 5, 'dx':0, 'dy':0},
		{'id': 162, 'type':'WALL', 'x': 14, 'y': 6, 'dx':0, 'dy':0},
		{'id': 163, 'type':'WALL', 'x': 14, 'y': 7, 'dx':0, 'dy':0},
		{'id': 164, 'type':'WALL', 'x': 14, 'y': 8, 'dx':0, 'dy':0},
		{'id': 165, 'type':'WALL', 'x': 14, 'y': 9, 'dx':0, 'dy':0},
		{'id': 166, 'type':'WALL', 'x': 14, 'y': 10, 'dx':0, 'dy':0},
		{'id': 167, 'type':'BOMB', 'x': 14, 'y': 11, 'dx':0, 'dy':0},
		{'id': 168, 'type':'WALL', 'x': 14, 'y': 12, 'dx':0, 'dy':0},
		{'id': 169, 'type':'WALL', 'x': 14, 'y': 13, 'dx':0, 'dy':0},
		{'id': 170, 'type':'WALL', 'x': 14, 'y': 18, 'dx':0, 'dy':0},
		{'id': 171, 'type':'WALL', 'x': 14, 'y': 20, 'dx':0, 'dy':0},
		{'id': 172, 'type':'WALL', 'x': 15, 'y': 2, 'dx':0, 'dy':0},
		{'id': 173, 'type':'WALL', 'x': 15, 'y': 3, 'dx':0, 'dy':0},
		{'id': 174, 'type':'WALL', 'x': 15, 'y': 7, 'dx':0, 'dy':0},
		{'id': 175, 'type':'GUN-R', 'x': 15, 'y': 8, 'dx':0, 'dy':0, 'count':3, 'maxcount':3},
		{'id': 176, 'type':'WALL', 'x': 15, 'y': 9, 'dx':0, 'dy':0},
		{'id': 177, 'type':'GUN-R', 'x': 15, 'y': 10, 'dx':0, 'dy':0, 'count':1, 'maxcount':3},
		{'id': 178, 'type':'GUN-R', 'x': 15, 'y': 11, 'dx':0, 'dy':0, 'count':1, 'maxcount':3},
		{'id': 179, 'type':'GUN-R', 'x': 15, 'y': 12, 'dx':0, 'dy':0, 'count':1, 'maxcount':3},
		{'id': 180, 'type':'WALL', 'x': 15, 'y': 13, 'dx':0, 'dy':0},
		{'id': 181, 'type':'WALL', 'x': 15, 'y': 18, 'dx':0, 'dy':0},
		{'id': 182, 'type':'ANT', 'x': 15, 'y': 19, 'dx':1, 'dy':0},
		{'id': 183, 'type':'WALL', 'x': 15, 'y': 20, 'dx':0, 'dy':0},
		{'id': 184, 'type':'WALL', 'x': 16, 'y': 2, 'dx':0, 'dy':0},
		{'id': 185, 'type':'TELEPORT', 'x': 16, 'y': 4, 'dx':0, 'dy':0, 'destx':9, 'desty':3},
		{'id': 186, 'type':'LEADENCRATE', 'x': 16, 'y': 6, 'dx':0, 'dy':0},
		{'id': 187, 'type':'LEADENCRATE', 'x': 16, 'y': 9, 'dx':0, 'dy':0},
		{'id': 188, 'type':'WALL', 'x': 16, 'y': 13, 'dx':0, 'dy':0},
		{'id': 189, 'type':'WALL', 'x': 16, 'y': 18, 'dx':0, 'dy':0},
		{'id': 190, 'type':'WALL', 'x': 16, 'y': 20, 'dx':0, 'dy':0},
		{'id': 191, 'type':'WALL', 'x': 17, 'y': 2, 'dx':0, 'dy':0},
		{'id': 192, 'type':'CRATE', 'x': 17, 'y': 5, 'dx':0, 'dy':0},
		{'id': 193, 'type':'WALL', 'x': 17, 'y': 7, 'dx':0, 'dy':0},
		{'id': 194, 'type':'WALL', 'x': 17, 'y': 9, 'dx':0, 'dy':0},
		{'id': 195, 'type':'WALL', 'x': 17, 'y': 13, 'dx':0, 'dy':0},
		{'id': 196, 'type':'WALL', 'x': 17, 'y': 17, 'dx':0, 'dy':0},
		{'id': 197, 'type':'WALL', 'x': 17, 'y': 18, 'dx':0, 'dy':0},
		{'id': 198, 'type':'DOOR', 'x': 17, 'y': 19, 'dx':0, 'dy':0},
		{'id': 199, 'type':'WALL', 'x': 17, 'y': 20, 'dx':0, 'dy':0},
		{'id': 200, 'type':'WALL', 'x': 17, 'y': 21, 'dx':0, 'dy':0},
		{'id': 201, 'type':'WALL', 'x': 18, 'y': 2, 'dx':0, 'dy':0},
		{'id': 202, 'type':'WALL', 'x': 18, 'y': 7, 'dx':0, 'dy':0},
		{'id': 203, 'type':'WALL', 'x': 18, 'y': 13, 'dx':0, 'dy':0},
		{'id': 204, 'type':'WALL', 'x': 18, 'y': 14, 'dx':0, 'dy':0},
		{'id': 205, 'type':'WALL', 'x': 18, 'y': 16, 'dx':0, 'dy':0},
		{'id': 206, 'type':'ANT', 'x': 18, 'y': 17, 'dx':-1, 'dy':0},
		{'id': 207, 'type':'WALL', 'x': 18, 'y': 22, 'dx':0, 'dy':0},
		{'id': 208, 'type':'WALL', 'x': 19, 'y': 2, 'dx':0, 'dy':0},
		{'id': 209, 'type':'WALL', 'x': 19, 'y': 3, 'dx':0, 'dy':0},
		{'id': 210, 'type':'WALL', 'x': 19, 'y': 5, 'dx':0, 'dy':0},
		{'id': 211, 'type':'DOOR', 'x': 19, 'y': 7, 'dx':0, 'dy':0},
		{'id': 212, 'type':'WALL', 'x': 19, 'y': 9, 'dx':0, 'dy':0},
		{'id': 213, 'type':'TELEPORT', 'x': 19, 'y': 13, 'dx':0, 'dy':0, 'destx':3, 'desty':13},
		{'id': 214, 'type':'WALL', 'x': 19, 'y': 14, 'dx':0, 'dy':0},
		{'id': 215, 'type':'WALL', 'x': 19, 'y': 16, 'dx':0, 'dy':0},
		{'id': 216, 'type':'LEADENCRATE', 'x': 19, 'y': 19, 'dx':0, 'dy':0},
		{'id': 217, 'type':'WALL', 'x': 19, 'y': 22, 'dx':0, 'dy':0},
		{'id': 218, 'type':'WALL', 'x': 20, 'y': 3, 'dx':0, 'dy':0},
		{'id': 219, 'type':'WALL', 'x': 20, 'y': 4, 'dx':0, 'dy':0},
		{'id': 220, 'type':'WALL', 'x': 20, 'y': 5, 'dx':0, 'dy':0},
		{'id': 221, 'type':'WALL', 'x': 20, 'y': 6, 'dx':0, 'dy':0},
		{'id': 222, 'type':'WALL', 'x': 20, 'y': 7, 'dx':0, 'dy':0},
		{'id': 223, 'type':'WALL', 'x': 20, 'y': 13, 'dx':0, 'dy':0},
		{'id': 224, 'type':'WALL', 'x': 20, 'y': 14, 'dx':0, 'dy':0},
		{'id': 225, 'type':'WALL', 'x': 20, 'y': 16, 'dx':0, 'dy':0},
		{'id': 226, 'type':'ANT', 'x': 20, 'y': 21, 'dx':0, 'dy':-1},
		{'id': 227, 'type':'WALL', 'x': 20, 'y': 22, 'dx':0, 'dy':0},
		{'id': 228, 'type':'WALL', 'x': 21, 'y': 6, 'dx':0, 'dy':0},
		{'id': 229, 'type':'WALL', 'x': 21, 'y': 7, 'dx':0, 'dy':0},
		{'id': 230, 'type':'LEADENCRATE', 'x': 21, 'y': 8, 'dx':0, 'dy':0},
		{'id': 231, 'type':'DETONATOR', 'x': 21, 'y': 9, 'dx':0, 'dy':0, 'bomb': 167},
		{'id': 232, 'type':'LEADENCRATE', 'x': 21, 'y': 10, 'dx':0, 'dy':0},
		{'id': 233, 'type':'LEADENCRATE', 'x': 21, 'y': 11, 'dx':0, 'dy':0},
		{'id': 234, 'type':'LEADENCRATE', 'x': 21, 'y': 12, 'dx':0, 'dy':0},
		{'id': 235, 'type':'WALL', 'x': 21, 'y': 13, 'dx':0, 'dy':0},
		{'id': 236, 'type':'WALL', 'x': 21, 'y': 17, 'dx':0, 'dy':0},
		{'id': 237, 'type':'WALL', 'x': 21, 'y': 18, 'dx':0, 'dy':0},
		{'id': 238, 'type':'WALL', 'x': 21, 'y': 19, 'dx':0, 'dy':0},
		{'id': 239, 'type':'WALL', 'x': 21, 'y': 20, 'dx':0, 'dy':0},
		{'id': 240, 'type':'WALL', 'x': 22, 'y': 7, 'dx':0, 'dy':0},
		{'id': 241, 'type':'WALL', 'x': 22, 'y': 8, 'dx':0, 'dy':0},
		{'id': 242, 'type':'WALL', 'x': 22, 'y': 9, 'dx':0, 'dy':0},
		{'id': 243, 'type':'WALL', 'x': 22, 'y': 10, 'dx':0, 'dy':0},
		{'id': 244, 'type':'WALL', 'x': 22, 'y': 11, 'dx':0, 'dy':0},
		{'id': 245, 'type':'WALL', 'x': 22, 'y': 12, 'dx':0, 'dy':0},
		{'id': 246, 'type':'WALL', 'x': 22, 'y': 13, 'dx':0, 'dy':0},
		{'id': 247, 'type':'WALL', 'x': 21, 'y': 21, 'dx':0, 'dy':0},
		{'id': 248, 'type':'ANT', 'x': 5, 'y': 13, 'dx':1, 'dy':0},
	    ],
	    'state':{'keys' : 0}
	});
};


/// GAMELOOP TOTAL WIESZ ///
var joystick={dx:0,dy:0}; /// joystick from keyboard ;)

reset_joystick = function() {
    joystick.dx = 0;
    joystick.dy = 0;
};

window.addEventListener('keydown',
			function(evt) {
			    if(evt.keyCode==37) {joystick.dx=-1; joystick.dy=0;} // left arrow 37
			    if(evt.keyCode==39) {joystick.dx=1; joystick.dy=0;}  // right arrow 39
			    if(evt.keyCode==38) {joystick.dy=-1; joystick.dx=0;}  // up arrow 38
			    if(evt.keyCode==40) {joystick.dy=1; joystick.dx=0;} // down arrow 40
			},
			false);


var vcx = 0;
var vcy = 0;

draw_level = function(level) {
    var map_w = 23; /// !!
    var map_h = 23; /// !!
    var tile_w = 32;
    var tile_h = 32;
    var mid_tile_x = Math.floor(screen_w/(tile_w*2.0));
    var mid_tile_y = Math.floor(screen_h/(tile_h*2.0));
    var hero = find_by_id(level,0);
    if(hero != null) {
	vcx = hero.x;
	vcy = hero.y;
    }
    var adjust_x = mid_tile_x-Math.max(Math.min(vcx, map_w-mid_tile_x+1), mid_tile_x-1);
    var adjust_y = mid_tile_y-Math.max(Math.min(vcy, map_h-mid_tile_y), mid_tile_y-1);
    kontekst.fillStyle="#ffffff";
    kontekst.fillRect(0,0,screen_w,screen_h);
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	if(object == null) continue;
	var x=(object.x+adjust_x)*tile_w;
	var y=(object.y+adjust_y)*tile_h;
	//console.log(Sprites[object.type]);
	if(Sprites[object.type] == undefined) {alert('nie ma sprajta dla '+object.type+'!');}
	var sprite = Sprites[object.type];
	if(object.type == 'ANT') {
	    if(object.dx>0) sprite = sprite['right'];
	    else if(object.dx<0) sprite = sprite['left'];
	    else if(object.dy>0) sprite = sprite['down'];
	    else sprite = sprite['up'];
	}
	kontekst.drawImage(sprite, x, y);
    }
    /*
    kontekst.font="11px arial";
    kontekst.fillStyle="#000000";
    kontekst.fillText("keys : "+level.state.keys,13,13);
    */
};


level = load_level();

setInterval(function(){ 
    var dx=joystick.dx;
    var dy=joystick.dy;    
    reset_joystick();
    if(dx!=0 || dy!=0) {
	var hero = find_by_id(level, 0);
	hero.dx = dx;
	hero.dy = dy;
	level = update_object(level, hero.id, hero);
    }
    for(var i=0;i<level.objects.length;i++) {
	var object = level.objects[i];
	var deleted = false;
	if(object == null) continue;	
	if(typeof object.expires == 'number') {
	    if(object.expires == 0) {
		level = delete_object(level, object.id);
		deleted = true;
	    } else {
		object.expires--;
		level = update_object(level, object.id, object);
	    }
	}
	if(typeof object.count == 'number') {
	    if(object.count == 0) {
		switch(object.type) {
		case 'GUN-L':
		    var x = object.x, y=object.y;
		    var dx = -1, dy = 0;
		    level = spawn_object(level, new_particle(x,y,dx,dy), true);
		    break;
		case 'GUN-R':	
		    var x = object.x, y=object.y;
		    var dx = 1, dy = 0;
		    level = spawn_object(level, new_particle(x,y,dx,dy), true);
		    break;	   
		case 'GUN-U':	
		    var x = object.x, y=object.y;
		    var dx = 0, dy = -1;
		    level = spawn_object(level, new_particle(x,y,dx,dy), true);
		    break;	   
		case 'GUN-D':	
		    var x = object.x, y=object.y;
		    var dx = 0, dy = 1;
		    level = spawn_object(level, new_particle(x,y,dx,dy), true);
		    break;	   
		}	
		object.count = object.maxcount;
	    } else {
		object.count--;
	    }
	    level = update_object(level, object.id, object);
	}
	if(deleted || (object.dx == 0 && object.dy == 0)) continue;
	var nx = object.x + object.dx;
	var ny = object.y + object.dy;
	level = move_object(level, object.id, nx, ny);
    }
    level = clean_up(level);
    draw_level(level);
    var hero = find_by_id(level, 0);
    if(hero == null) {
	level = load_level();
    } else {
	hero.dx = 0;
	hero.dy = 0;
	level = update_object(level, hero.id, hero);
    }
    ///ascii_level(level);
},171);
