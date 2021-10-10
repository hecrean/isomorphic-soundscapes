/*
		💉 injected uniforms by three.js. 
		uniform mat4 modelMatrix; ✅ 			// = object.matrixWorld
		uniform mat4 modelViewMatrix; ✅ 	// = camera.matrixWorldInverse * object.matrixWorld
		uniform mat4 projectionMatrix; ✅ 	// = camera.projectionMatrix
		uniform mat4 viewMatrix; ✅				// = camera.matrixWorldInverse
		uniform mat3 normalMatrix; ✅			// = inverse transpose of modelViewMatrix
		uniform vec3 cameraPosition; ✅		// = camera position in world space
*/

/*
	 💉 injected attributes:  ✅ attributes will be parsed in by most buffer geometry in three.js. For gltf
	 files we have to inspect it to know exactly what is passed in... 
	attribute vec3 position; //POSITION ✅
	attribute vec3 normal; //NORMAL ✅
	attribute vec3 tangent; //TANGENT
	attribute vec2 uv; //TEXCOORD_0
	attribute vec2 uv2; //TEXCOORD_1
	attribute vec4 color; //COLOR_0 
	attribute vec3 skinWeight; //WEIGHTS_0
	attribute vec3 skinIndex; //JOINTS_0
*/

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

}