// Vertex shader program----------------------------------
var VSHADER_SOURCE =
`uniform mat4 u_ModelMatrix;
attribute vec4 a_Position;
attribute vec4 a_Color;
varying vec4 v_Color;
void main() {
  gl_Position = u_ModelMatrix * a_Position;
  gl_PointSize = 10.0;
  v_Color = a_Color;
}`;

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
`precision mediump float;
varying vec4 v_Color;
void main() {
  gl_FragColor = v_Color;
}`;

// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvas;									// HTML-5 'canvas' element ID#. (was 'canvas')
var colorShapes;								// # of vertices held by our VBO.(was 'n')
var g_modelMatrix;							// 4x4 matrix in JS; sets 'uniform' in GPU
var uLoc_ModelMatrix;						// GPU location where this uniform is stored.

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
                                // most-recently-drawn WebGL screen contents.  
                                // Set & used by timerAll() fcn to update all
                                // time-varying params for our webGL drawings.
  // All of our time-dependent params (you can add more!)
                                //---------------
var g_angle0now  =   0.0;       // init Current rotation angle, in degrees
var g_angle0rate = -22.0;       // init Rotation angle rate, in degrees/second.
var g_angle0brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle0min  =   0.0;       // init min, max allowed angle, in degrees.
var g_angle0max  =  60.0;
                                //---------------
var g_angle1now  =   0.0; 			// init Current rotation angle, in degrees > 0
var g_angle1rate =   0.1;				// init Rotation angle rate, in degrees/second.
var g_angle1brake=	 1.0;				// init Rotation start/stop. 0=stop, 1=full speed.
var g_angle1min  =  -0.4;       // init min, max allowed angle, in degrees
var g_angle1max  =   0.8;
                                //---------------
var g_angle2now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle2rate =  15.0;				// init Rotation angle rate, in degrees/second.
var g_angle2brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle2min  =  30.0;       // init min, max allowed angle, in degrees
var g_angle2max  =  90.0;			

var g_angle3now  =   0.0; 			// init Current rotation angle, in degrees.
var g_angle3rate =  31.0;				// init Rotation angle rate, in degrees/second.
var g_angle3brake=	 1.0;				// init Speed control; 0=stop, 1=full speed.
var g_angle3min  = -40.0;       // init min, max allowed angle, in degrees
var g_angle3max  =  40.0;	

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits

var d20_scale_now = 1;
var d20_scale_step = 0.02;

var floatsPerVertex = 7;

function main() {

  g_canvas = document.getElementById('webgl');	
  gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});			 
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL. Bye!');
    return;
  }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  var myErr = initVertexBuffers(); // sets global var 'colorShapes'
  if (myErr < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("mousedown", myMouseDown); 
  window.addEventListener("mousemove", myMouseMove); 
  window.addEventListener("mouseup", myMouseUp);	
  window.addEventListener("click", myMouseClick);				
  window.addEventListener("dblclick", myMouseDblClick); 
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST); 
  g_modelMatrix = new Matrix4();
  uLoc_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!uLoc_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
 }

  var tick = function() {
    requestAnimationFrame(tick, g_canvas); 
    timerAll();  			
    drawAll();        
    };

  tick();                   
}

function timerAll() {

  var nowMS = Date.now();            
  var elapsedMS = nowMS - g_lastMS;   
  g_lastMS = nowMS;                  
  if(elapsedMS > 1000.0) {            
    elapsedMS = 1000.0/30.0;
    }

  g_angle0now += g_angle0rate * g_angle0brake * (elapsedMS * 0.001);
  g_angle1now += g_angle1rate * g_angle1brake * (elapsedMS * 0.001);
  g_angle2now += g_angle2rate * g_angle2brake * (elapsedMS * 0.001);

  if((g_angle0now >= g_angle0max && g_angle0rate > 0) || // going over max, or
  	 (g_angle0now <= g_angle0min && g_angle0rate < 0)  ) // going under min ?
  	 g_angle0rate *= -1;	// YES: reverse direction.
  if((g_angle1now >= g_angle1max && g_angle1rate > 0) || // going over max, or
  	 (g_angle1now <= g_angle1min && g_angle1rate < 0) )	 // going under min ?
  	 g_angle1rate *= -1;	// YES: reverse direction.
  if((g_angle2now >= g_angle2max && g_angle2rate > 0) || // going over max, or
  	 (g_angle2now <= g_angle2min && g_angle2rate < 0) )	 // going under min ?
  	 g_angle2rate *= -1;	// YES: reverse direction.
  if((g_angle3now >= g_angle3max && g_angle3rate > 0) || // going over max, or
  	 (g_angle3now <= g_angle3min && g_angle3rate < 0) )	 // going under min ?
  	 g_angle3rate *= -1;	// YES: reverse direction.
	// *NO* limits? Don't let angles go to infinity! cycle within -180 to +180.
	if(g_angle0min > g_angle0max)	
	{// if min and max don't limit the angle, then
		if(     g_angle0now < -180.0) g_angle0now += 360.0;	// go to >= -180.0 or
		else if(g_angle0now >  180.0) g_angle0now -= 360.0;	// go to <= +180.0
	}
	if(g_angle1min > g_angle1max)
	{
		if(     g_angle1now < -180.0) g_angle1now += 360.0;	// go to >= -180.0 or
		else if(g_angle1now >  180.0) g_angle1now -= 360.0;	// go to <= +180.0
	}
	if(g_angle2min > g_angle2max)
	{
		if(     g_angle2now < -180.0) g_angle2now += 360.0;	// go to >= -180.0 or
		else if(g_angle2now >  180.0) g_angle2now -= 360.0;	// go to <= +180.0
	}
	if(g_angle3min > g_angle3max)
	{
		if(     g_angle3now < -180.0) g_angle3now += 360.0;	// go to >= -180.0 or
		else if(g_angle3now >  180.0) g_angle3now -= 360.0;	// go to <= +180.0
	}
}

function makeD20() {
	capVerts = 5;
	d20Verts = new Float32Array(((capVerts*6)+4) * floatsPerVertex);

	// TOP
	for(v=1,j=0; v<2*capVerts+2; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			d20Verts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			d20Verts[j+1] = 0.0;	
			d20Verts[j+2] = 1.0; 
			d20Verts[j+3] = 1.0;			
			d20Verts[j+4]=Math.random(); 
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();
		}
		else { 	// put odd# vertices around the top cap's outer edge;
			d20Verts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			d20Verts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			d20Verts[j+2] = 0.5;	// z
			d20Verts[j+3] = 1.0;	// w.
			d20Verts[j+4]=Math.random();
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();		
		}
		// console.log('vert '+v+': ('+d20Verts[j]+','+d20Verts[j+1]+','+d20Verts[j+2]+')')
	}

	// TOP BOTTOM MERGER


	// SIDE WALL
	for(v=0; v< 2*capVerts+2; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
			d20Verts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
			d20Verts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
			d20Verts[j+2] = 0.5;	// z
			d20Verts[j+3] = 1.0;	// w.
			d20Verts[j+4]=Math.random();
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();		
		}
		else		// position all odd# vertices along the bottom cap:
		{
			d20Verts[j  ] = Math.cos((Math.PI*(v)/capVerts));		// x
			d20Verts[j+1] = Math.sin((Math.PI*(v)/capVerts));		// y
			d20Verts[j+2] =-0.5;	// z
			d20Verts[j+3] = 1.0;	// w.
			d20Verts[j+4]=Math.random();
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();		
		}
		// console.log('vert '+v+': ('+d20Verts[j]+','+d20Verts[j+1]+','+d20Verts[j+2]+')')
	}

	// BOTTOM
	for(v=1; v<2*capVerts+2; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			d20Verts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			d20Verts[j+1] = 0.0;	
			d20Verts[j+2] = -1.0; 
			d20Verts[j+3] = 1.0;			
			d20Verts[j+4]=Math.random(); 
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();
		}
		else { 	// put odd# vertices around the top cap's outer edge;
			d20Verts[j  ] = Math.cos((Math.PI*(v)/capVerts));			// x
			d20Verts[j+1] = Math.sin((Math.PI*(v)/capVerts));			// y
			d20Verts[j+2] = -0.5;	// z
			d20Verts[j+3] = 1.0;	// w.
			d20Verts[j+4]=Math.random();
			d20Verts[j+5]=Math.random();
			d20Verts[j+6]=Math.random();		
		}
	}

}

function makeHexagonalHourglass() {
	var capVerts = 6;	// # of vertices around the topmost 'cap' of the shape
	var botRadius = 1.0;		// radius of bottom of cylinder (top always 1.0)
	
	// Create a (global) array to hold this cylinder's vertices;
	hexVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										   // # of vertices * # of elements needed to store them. 
   
	   // TOP
	   for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		   // skip the first vertex--not needed.
		   if(v%2==0)
		   {				// put even# vertices at center of cylinder's top cap:
				hexVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
				hexVerts[j+1] = 0.0;	
				hexVerts[j+2] = 1.0; 
				hexVerts[j+3] = 1.0;			
				hexVerts[j+4]=Math.random(); 
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();
		   }
		   else { 	// put odd# vertices around the top cap's outer edge;
				hexVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
				hexVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
				hexVerts[j+2] = 1.0;	// z
				hexVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				hexVerts[j+4]=Math.random();
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();		
		   }
	   }
	   // SIDE WALL
	   for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		   if(v%2==0)	// position all even# vertices along top cap:
		   {		
				hexVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				hexVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				hexVerts[j+2] = 1.0;	// z
				hexVerts[j+3] = 1.0;	// w.
				hexVerts[j+4]=Math.random();
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();		
		   }
		   else		// position all odd# vertices along the bottom cap:
		   {
				hexVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				hexVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				hexVerts[j+2] =-1.0;	// z
				hexVerts[j+3] = 1.0;	// w.
				hexVerts[j+4]=Math.random();
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();		
		   }
	   }
	   
	   // BOTTOM
	   for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		   if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
				hexVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
				hexVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
				hexVerts[j+2] =-1.0;	// z
				hexVerts[j+3] = 1.0;	// w.
				hexVerts[j+4]=Math.random(); 
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();	
		   }
		   else {				// position odd#'d vertices at center of the bottom cap:
				hexVerts[j  ] = 0.0; 			
				hexVerts[j+1] = 0.0;	
				hexVerts[j+2] =-1.0; 
				hexVerts[j+3] = 1.0;			
				hexVerts[j+4]=Math.random();
				hexVerts[j+5]=Math.random();
				hexVerts[j+6]=Math.random();
		   }
	   }
   
}

function initVertexBuffers() {
  	// Make each 3D shape in its own array of vertices:
	  makeHexagonalHourglass();					// create, fill the cylVerts array
	  makeD20();								// create, fill d20Verts array

	// how many floats total needed to store all shapes?
	var mySiz = (hexVerts.length + d20Verts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
	var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	hexStart = 0;							// we stored the cylinder first.
	for(i=0,j=0; j< hexVerts.length; i++,j++) {
		colorShapes[i] = hexVerts[j];
	}
	d20Start = i;						// next, we'll store the sphere;
	for(j=0; j< d20Verts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = d20Verts[j];
	}
	// Create a buffer object on the graphics hardware:
	var shapeBufferHandle = gl.createBuffer();  
	if (!shapeBufferHandle) {
	console.log('Failed to create the shape buffer object');
	return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
	// Transfer data from Javascript array colorShapes to Graphics system VBO
	// (Use sparingly--may be slow if you transfer large shapes stored in files)
	gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
	
	//Get graphics system's handle for our Vertex Shader's position-input variable: 
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
	console.log('Failed to get the storage location of a_Position');
	return -1;
	}

	var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

	// Use handle to specify how to retrieve **POSITION** data from our VBO:
	gl.vertexAttribPointer(
			a_Position, 	// choose Vertex Shader attribute to fill with data
			4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
			gl.FLOAT, 		// data type for each value: usually gl.FLOAT
			false, 				// did we supply fixed-point data AND it needs normalizing?
			FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
										// (x,y,z,w, r,g,b) * bytes/value
			0);						// Offset -- now many bytes from START of buffer to the
										// value we will actually use?
	gl.enableVertexAttribArray(a_Position);  
										// Enable assignment of vertex buffer object's position data

	// Get graphics system's handle for our Vertex Shader's color-input variable;
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if(a_Color < 0) {
	console.log('Failed to get the storage location of a_Color');
	return -1;
	}
	// Use handle to specify how to retrieve **COLOR** data from our VBO:
	gl.vertexAttribPointer(
		a_Color, 				// choose Vertex Shader attribute to fill with data
		3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
		gl.FLOAT, 			// data type for each value: usually gl.FLOAT
		false, 					// did we supply fixed-point data AND it needs normalizing?
		FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
										// (x,y,z,w, r,g,b) * bytes/value
		FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
										// value we will actually use?  Need to skip over x,y,z,w
										
	gl.enableVertexAttribArray(a_Color);  
										// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
	// Unbind the buffer object 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return nn;
}

function drawAll() {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	g_modelMatrix.setIdentity();

	pushMatrix(g_modelMatrix);
	
	//-------Draw snake ring:
	g_modelMatrix.setTranslate(-0.7,-0.8, 0.0);  // 'set' means DISCARD old matrix,
	g_modelMatrix.rotate(40,0,1,0);

		pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(90, 0, 1, 0);  // spin around y axis.
		g_modelMatrix.scale(0.05, 0.05, 0.1);

		gl.uniformMatrix4fv(uLoc_ModelMatrix, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
			hexStart/floatsPerVertex, // start at this vertex number, and
			hexVerts.length/floatsPerVertex);	// draw this many vertices.
		g_modelMatrix = popMatrix(); 

	for(i = 0; i < 5; i++) {
		g_modelMatrix.translate(0.1, 0, 0);
		g_modelMatrix.rotate(g_angle0now,0,0,1);
		g_modelMatrix.translate(0.1, 0, 0);

			pushMatrix(g_modelMatrix);
			g_modelMatrix.rotate(90, 0, 1, 0);  // spin around y axis.
			g_modelMatrix.scale(0.05, 0.05, 0.1);

			gl.uniformMatrix4fv(uLoc_ModelMatrix, false, g_modelMatrix.elements);
			gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
				hexStart/floatsPerVertex, // start at this vertex number, and
				hexVerts.length/floatsPerVertex);	// draw this many vertices.
			g_modelMatrix = popMatrix(); 

	}

	// Draw fractal
	g_modelMatrix.setTranslate(0.6, g_angle1now, 0.0)
	g_modelMatrix.rotate(90,1,0,0);

		pushMatrix(g_modelMatrix);
		g_modelMatrix.scale(0.02, 0.02, 0.15);
		gl.uniformMatrix4fv(uLoc_ModelMatrix, false, g_modelMatrix.elements);
		gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
			hexStart/floatsPerVertex, // start at this vertex number, and
			hexVerts.length/floatsPerVertex);	// draw this many vertices.
		g_modelMatrix = popMatrix();

	g_modelMatrix.translate(0,0,0.15);

		var makeLeg = function(permLegAngle, legAngleNow) {			
			g_modelMatrix.rotate(permLegAngle,0,0,1);
			g_modelMatrix.rotate(legAngleNow,1,0,0);
			g_modelMatrix.translate(0,0,0.1);

				pushMatrix(g_modelMatrix);
				g_modelMatrix.scale(0.02, 0.02, 0.1);
				gl.uniformMatrix4fv(uLoc_ModelMatrix, false, g_modelMatrix.elements);
				gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
					hexStart/floatsPerVertex, // start at this vertex number, and
					hexVerts.length/floatsPerVertex);	// draw this many vertices.
				g_modelMatrix = popMatrix();			
		};

		var makeBranches = function() {
			pushMatrix(g_modelMatrix);
			makeLeg(60,g_angle2now);
			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			makeLeg(300,g_angle2now);
			g_modelMatrix = popMatrix();
			pushMatrix(g_modelMatrix);
			makeLeg(180,g_angle2now);
			g_modelMatrix = popMatrix();
		}

		pushMatrix(g_modelMatrix);
		makeLeg(60, g_angle2now);
		g_modelMatrix.translate(0,0,0.1);
			makeBranches();
		g_modelMatrix = popMatrix();

		pushMatrix(g_modelMatrix);
		makeLeg(300, g_angle2now);
		g_modelMatrix.translate(0,0,0.1);
			makeBranches();
		g_modelMatrix = popMatrix();

		pushMatrix(g_modelMatrix);
		makeLeg(180, g_angle2now);
		g_modelMatrix.translate(0,0,0.1);
			makeBranches();
		g_modelMatrix = popMatrix();
		
	// Draw D20

	g_modelMatrix.setTranslate(-0.6, 0.6, 0.0);

	// rotate on axis perpendicular to the mouse-drag direction:
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
	// why add 0.001? avoids divide-by-zero in next statement
	// in cases where user didn't drag the mouse.)
	g_modelMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
				// Acts weirdly as rotation amounts get far from 0 degrees.
				// ?why does intuition fail so quickly here?

	g_modelMatrix.scale(0.3*d20_scale_now,0.3*d20_scale_now,0.3*d20_scale_now);
	gl.uniformMatrix4fv(uLoc_ModelMatrix, false, g_modelMatrix.elements);
				gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
					d20Start/floatsPerVertex, // start at this vertex number, and
					d20Verts.length/floatsPerVertex);	// draw this many vertices.

	g_modelMatrix = popMatrix();  // DONE with robot-drawing; return

}

function testMatrixStack() {
//==============================================================================
// 
	console.log("------------------Test Matrix stack behavior----------------");
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("now push g_modelMatrix:");
	pushMatrix(g_modelMatrix);
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("CHANGE g_modelMatrix: rotate, translate:");
	g_modelMatrix.setRotate(60.0, 1,1,1);
	g_modelMatrix.translate(1,2,3);
	g_modelMatrix.printMe("new g_ModelMatrix");
	console.log("push new matrix onto stack");
	pushMatrix(g_modelMatrix);
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("stack:", __cuon_matrix_mod_stack);
	console.log("now 1st popMatrix:");
	g_modelMatrix = popMatrix();
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("stack:", __cuon_matrix_mod_stack);
	g_modelMatrix.printMe("after 1st pop g_ModelMatrix");
	console.log("now 2nd popMatrix");
	g_modelMatrix = popMatrix();
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("stack:", __cuon_matrix_mod_stack);	
	g_modelMatrix.printMe("after 2nd pop g_ModelMatrix");
/*
	// CAREFUL!! The next test will DESTROY contents of g_modelMatrix,
	// and replace current contents with identity matrix.
	console.log("now 3rd popMatrix (on empty stack)");
	g_modelMatrix = popMatrix();
	console.log("stack size:", __cuon_matrix_mod_stack.length);
	console.log("stack:", __cuon_matrix_mod_stack);	
	console.log("g_modelMatrix:", g_modelMatrix)
	g_modelMatrix.printMe("after 3nd pop g_ModelMatrix");
	// AHA! CONSOLE ERROR REPORT HERE: 
	// excess 'popMatrix' will MESS UP g_modelMatrix; it's now UNDEFINED!!!
	// Replace it with identity matrix.
	g_modelMatrix = new Matrix4();
	g_modelMatrix.printMe("RESTORED g_modelMatrix");
*/

	console.log("----------------END Test Matrix Stack-------------------------");
}
//========================
//
// HTML BUTTON HANDLERS
//
//========================

function A0_runStop() {
//==============================================================================
  if(g_angle0brake > 0.5)	// if running,
  {
  	g_angle0brake = 0.0;	// stop, and change button label:
  	document.getElementById("A0button").value="Start hexagonal snake";
	}
  else 
  {
  	g_angle0brake = 1.0;	// Otherwise, go.
  	document.getElementById("A0button").value="Stop hexagonal snake";
	}
}

function A1_runStop() {
//==============================================================================
  if(g_angle1brake > 0.5)	// if running,
  {
  	g_angle1brake = 0.0;	// stop, and change button label:
  	document.getElementById("A1button").value="Start jellysfish travel";
	}
  else 
  {
  	g_angle1brake = 1.0;	// Otherwise, go.
  	document.getElementById("A1button").value="Stop jellyfish travel";
	}
}
function A2_runStop() {
//==============================================================================
  if(g_angle2brake > 0.5)	// if running,
  {
  	g_angle2brake = 0.0;	// stop, and change button label:
  	document.getElementById("A2button").value="Start jellyfish limbs";
	}
  else 
  {
  	g_angle2brake = 1.0;	// Otherwise, go.
  	document.getElementById("A2button").value="Stop jellyfish limbs";
	}
}

function d20_reset() {
//==============================================================================
  d20_scale_now = 1;
  g_xMdragTot = 0;
  g_yMdragTot = 0;
}

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  
	
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
	
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							(g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								(g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	// document.getElementById('MouseAtResult').innerHTML = 
	// 	'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 

console.log('ev.button='+ev.button);
	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
	
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							(g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										-1 <= y < +1.
								(g_canvas.height/2);

//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	// document.getElementById('MouseAtResult').innerHTML = 
	// 	'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	// document.getElementById('MouseDragResult').innerHTML = 
	// 	'Mouse Drag: '+(x - g_xMclik).toFixed(g_digits)+', '
	// 		+(y - g_yMclik).toFixed(g_digits);


	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
	
	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							(g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
								(g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	console.log('g_xMdragTot='+g_xMdragTot);
	console.log('g_yMdragTot='+g_yMdragTot);
	// Report new mouse position:
	// document.getElementById('MouseAtResult').innerHTML = 
	// 	'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	// console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',
	// 	g_xMdragTot.toFixed(g_digits),',\t',g_yMdragTot.toFixed(g_digits));
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

	// STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

	// STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}

function myKeyDown(kev) {
	//===============================================================================
	// Called when user presses down ANY key on the keyboard;
	//
	// For a light, easy explanation of keyboard events in JavaScript,
	// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
	// For a thorough explanation of a mess of JavaScript keyboard event handling,
	// see:    http://javascript.info/tutorial/keyboard-events
	//
	// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
	//        'keydown' event deprecated several read-only properties I used
	//        previously, including kev.charCode, kev.keyCode. 
	//        Revised 2/2019:  use kev.key and kev.code instead.
	//
	// Report EVERYTHING in console:
	  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
				  "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
				  "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
	
	// and report EVERYTHING on webpage:
	// 	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
	//   document.getElementById('KeyModResult' ).innerHTML = ''; 
	  // key details:
	//   document.getElementById('KeyModResult' ).innerHTML = 
	// 		"   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
	// 	"<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
	// 	"<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
	 
		switch(kev.code) {
			case "ArrowUp":		
				console.log('   up-arrow.');
				if (d20_scale_now < 2.9)
					d20_scale_now += d20_scale_step;
					console.log('scale: '+d20_scale_now);
			//   document.getElementById('KeyDownResult').innerHTML =
			// 	  'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
				break;
			case "ArrowDown":
				console.log(' down-arrow.');
				if (d20_scale_now > 0.05)
					d20_scale_now -= d20_scale_step;
					console.log('scale: '+d20_scale_now);
			//   document.getElementById('KeyDownResult').innerHTML =
			// 	  'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
			  break;	
		default:
		  console.log("UNUSED!");
			//   document.getElementById('KeyDownResult').innerHTML =
			// 	  'myKeyDown(): UNUSED!';
		  break;
		}
	}
	
	function myKeyUp(kev) {
	//===============================================================================
	// Called when user releases ANY key on the keyboard; captures scancodes well
	
		console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
	}
	
