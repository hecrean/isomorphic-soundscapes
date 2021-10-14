import React, {
    useMemo,
    useState,
    useRef,
    FC,
    useEffect,
    Suspense,
} from 'react'
//R3F
import {
    Canvas,
    useFrame,
    MeshProps,
    useThree,
    useLoader,
} from '@react-three/fiber'
// Deai - R3F
import {
    softShadows,
    MeshWobbleMaterial,
    OrbitControls,
    PositionalAudio,
    Html,
} from '@react-three/drei'
// React Spring
import { useSpring, animated, AnimatedComponent } from '@react-spring/three'
// three
import {
    RedFormat,
    LuminanceFormat,
    DataTexture,
    BufferGeometry,
    Mesh,
    SphereBufferGeometry,
    ShaderMaterial,
    IUniform,
    Vector2,
    Audio,
    AudioAnalyser,
    AudioContext,
    AudioListener,
    AudioLoader,
} from 'three'
// shaders:
import glsl from 'babel-plugin-glsl/macro'
// sound
// Styles
import '@pages/demo/Demo.scss'

// soft Shadows
softShadows()

type AssetKey = 'james-blake' | 'nils-frahn' // <- this is simply for better autocompletion
const musicAsset: { [name in AssetKey]: { name: string; path: string } } = {
    'james-blake': {
        name: 'James Blake - Are You in Love',
        path: '/James Blake - Are You In Love.mp3',
    },
    'nils-frahn': { name: 'Nils Frahm - Corn', path: '/Nils Frahm - Corn.mp3' },
}

interface Uniforms extends Record<string, IUniform<any>> {
    mouse: IUniform<Vector2>
    tAudioData: IUniform<DataTexture>
}

const vertexShader = glsl`
/*
	 💉 injected attributes:  ✅ attributes will be parsed in by most buffer geometry in three.js. For gltf
	 files we have to inspect it to know exactly what is passed in... 
	attribute vec3 position; //POSITION ✅
	attribute vec3 normal; //NORMAL ✅
	attribute vec3 tangent; //TANGENT
	attribute vec2 uv; //TEXCOORD_0 ✅
	attribute vec2 uv2; //TEXCOORD_1
	attribute vec4 color; //COLOR_0 
	attribute vec3 skinWeight; //WEIGHTS_0
	attribute vec3 skinIndex; //JOINTS_0
*/
uniform sampler2D tAudioData;
uniform vec2 mouse; 
varying vec2 vUv; 

// Permutation polynomial: (34x^2 + x) mod 289
vec3 permute(vec3 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}
vec3 dist(vec3 x, vec3 y, vec3 z,  bool manhattanDistance) {
  return manhattanDistance ?  abs(x) + abs(y) + abs(z) :  (x * x + y * y + z * z);
}
vec2 worley(vec3 P, float jitter, bool manhattanDistance) {
float K = 0.142857142857; // 1/7
float Ko = 0.428571428571; // 1/2-K/2
float  K2 = 0.020408163265306; // 1/(7*7)
float Kz = 0.166666666667; // 1/6
float Kzo = 0.416666666667; // 1/2-1/6*2
	vec3 Pi = mod(floor(P), 289.0);
 	vec3 Pf = fract(P) - 0.5;
	vec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);
	vec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);
	vec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);
	vec3 p = permute(Pi.x + vec3(-1.0, 0.0, 1.0));
	vec3 p1 = permute(p + Pi.y - 1.0);
	vec3 p2 = permute(p + Pi.y);
	vec3 p3 = permute(p + Pi.y + 1.0);
	vec3 p11 = permute(p1 + Pi.z - 1.0);
	vec3 p12 = permute(p1 + Pi.z);
	vec3 p13 = permute(p1 + Pi.z + 1.0);
	vec3 p21 = permute(p2 + Pi.z - 1.0);
	vec3 p22 = permute(p2 + Pi.z);
	vec3 p23 = permute(p2 + Pi.z + 1.0);
	vec3 p31 = permute(p3 + Pi.z - 1.0);
	vec3 p32 = permute(p3 + Pi.z);
	vec3 p33 = permute(p3 + Pi.z + 1.0);
	vec3 ox11 = fract(p11*K) - Ko;
	vec3 oy11 = mod(floor(p11*K), 7.0)*K - Ko;
	vec3 oz11 = floor(p11*K2)*Kz - Kzo; // p11 < 289 guaranteed
	vec3 ox12 = fract(p12*K) - Ko;
	vec3 oy12 = mod(floor(p12*K), 7.0)*K - Ko;
	vec3 oz12 = floor(p12*K2)*Kz - Kzo;
	vec3 ox13 = fract(p13*K) - Ko;
	vec3 oy13 = mod(floor(p13*K), 7.0)*K - Ko;
	vec3 oz13 = floor(p13*K2)*Kz - Kzo;
	vec3 ox21 = fract(p21*K) - Ko;
	vec3 oy21 = mod(floor(p21*K), 7.0)*K - Ko;
	vec3 oz21 = floor(p21*K2)*Kz - Kzo;
	vec3 ox22 = fract(p22*K) - Ko;
	vec3 oy22 = mod(floor(p22*K), 7.0)*K - Ko;
	vec3 oz22 = floor(p22*K2)*Kz - Kzo;
	vec3 ox23 = fract(p23*K) - Ko;
	vec3 oy23 = mod(floor(p23*K), 7.0)*K - Ko;
	vec3 oz23 = floor(p23*K2)*Kz - Kzo;
	vec3 ox31 = fract(p31*K) - Ko;
	vec3 oy31 = mod(floor(p31*K), 7.0)*K - Ko;
	vec3 oz31 = floor(p31*K2)*Kz - Kzo;
	vec3 ox32 = fract(p32*K) - Ko;
	vec3 oy32 = mod(floor(p32*K), 7.0)*K - Ko;
	vec3 oz32 = floor(p32*K2)*Kz - Kzo;
	vec3 ox33 = fract(p33*K) - Ko;
	vec3 oy33 = mod(floor(p33*K), 7.0)*K - Ko;
	vec3 oz33 = floor(p33*K2)*Kz - Kzo;
	vec3 dx11 = Pfx + jitter*ox11;
	vec3 dy11 = Pfy.x + jitter*oy11;
	vec3 dz11 = Pfz.x + jitter*oz11;
	vec3 dx12 = Pfx + jitter*ox12;
	vec3 dy12 = Pfy.x + jitter*oy12;
	vec3 dz12 = Pfz.y + jitter*oz12;
	vec3 dx13 = Pfx + jitter*ox13;
	vec3 dy13 = Pfy.x + jitter*oy13;
	vec3 dz13 = Pfz.z + jitter*oz13;
	vec3 dx21 = Pfx + jitter*ox21;
	vec3 dy21 = Pfy.y + jitter*oy21;
	vec3 dz21 = Pfz.x + jitter*oz21;
	vec3 dx22 = Pfx + jitter*ox22;
	vec3 dy22 = Pfy.y + jitter*oy22;
	vec3 dz22 = Pfz.y + jitter*oz22;
	vec3 dx23 = Pfx + jitter*ox23;
	vec3 dy23 = Pfy.y + jitter*oy23;
	vec3 dz23 = Pfz.z + jitter*oz23;
	vec3 dx31 = Pfx + jitter*ox31;
	vec3 dy31 = Pfy.z + jitter*oy31;
	vec3 dz31 = Pfz.x + jitter*oz31;
	vec3 dx32 = Pfx + jitter*ox32;
	vec3 dy32 = Pfy.z + jitter*oy32;
	vec3 dz32 = Pfz.y + jitter*oz32;
	vec3 dx33 = Pfx + jitter*ox33;
	vec3 dy33 = Pfy.z + jitter*oy33;
	vec3 dz33 = Pfz.z + jitter*oz33;
	vec3 d11 = dist(dx11, dy11, dz11, manhattanDistance);
	vec3 d12 =dist(dx12, dy12, dz12, manhattanDistance);
	vec3 d13 = dist(dx13, dy13, dz13, manhattanDistance);
	vec3 d21 = dist(dx21, dy21, dz21, manhattanDistance);
	vec3 d22 = dist(dx22, dy22, dz22, manhattanDistance);
	vec3 d23 = dist(dx23, dy23, dz23, manhattanDistance);
	vec3 d31 = dist(dx31, dy31, dz31, manhattanDistance);
	vec3 d32 = dist(dx32, dy32, dz32, manhattanDistance);
	vec3 d33 = dist(dx33, dy33, dz33, manhattanDistance);
	vec3 d1a = min(d11, d12);
	d12 = max(d11, d12);
	d11 = min(d1a, d13); // Smallest now not in d12 or d13
	d13 = max(d1a, d13);
	d12 = min(d12, d13); // 2nd smallest now not in d13
	vec3 d2a = min(d21, d22);
	d22 = max(d21, d22);
	d21 = min(d2a, d23); // Smallest now not in d22 or d23
	d23 = max(d2a, d23);
	d22 = min(d22, d23); // 2nd smallest now not in d23
	vec3 d3a = min(d31, d32);
	d32 = max(d31, d32);
	d31 = min(d3a, d33); // Smallest now not in d32 or d33
	d33 = max(d3a, d33);
	d32 = min(d32, d33); // 2nd smallest now not in d33
	vec3 da = min(d11, d21);
	d21 = max(d11, d21);
	d11 = min(da, d31); // Smallest now in d11
	d31 = max(da, d31); // 2nd smallest now not in d31
	d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
	d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest
	d12 = min(d12, d21); // 2nd smallest now not in d21
	d12 = min(d12, d22); // nor in d22
	d12 = min(d12, d31); // nor in d31
	d12 = min(d12, d32); // nor in d32
	d11.yz = min(d11.yz,d12.xy); // nor in d12.yz
	d11.y = min(d11.y,d12.z); // Only two more to go
	d11.y = min(d11.y,d11.z); // Done! (Phew!)
	return sqrt(d11.xy); // F1, F2
}



void main()
{

		vec4 sound = texture2D( tAudioData, vec2( vUv.x, vUv.y ) );


    vec4 modelPosition = modelMatrix * vec4( worley(vec3(position.x, position.y, position.y), sound.r, true), position.z, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

		vUv = uv; 

}
`
const fragmentShader = glsl`
// #pragma glslify: blend = require("../../shaders/functions/glsl-blend/add.glsl")
#pragma glslify: fft = require(glsl-fft)


vec2 resolution = vec2(0.25, 0.5); 
float subtransformSize = 2.0;
float normalization = 1.0; 
bool horizontal = true; 
bool forward = true; 


uniform sampler2D tAudioData;
uniform vec2 mouse; 

varying vec2 vUv; 


void main()
{
	// vec4 fourier_transform = fft(tAudioData, resolution, subtransformSize, horizontal, forward, normalization);

	// I think all the data is packed into the .r channel, but whatever... 
	vec4 sound = texture2D( tAudioData, vec2( vUv.x, vUv.y ) );
  gl_FragColor = vec4(sound.r, mouse.x, mouse.y, 1.);
}
`

interface SoundMeshProps extends MeshProps {
    position: [number, number, number]
    // bufferGeomeryArgs: ConstructorParameters<typeof SphereBufferGeometry>;
}

const SoundMesh: FC<SoundMeshProps> = ({ position }) => {
    // muisc :
    const { camera, mouse, gl } = useThree()

    const [trackUrl, setTrackUrl] = useState(musicAsset['james-blake'].path)
    const [playing, setPlaying] = useState<boolean>(false)
    const buffer: AudioBuffer | AudioBuffer[] = useLoader(AudioLoader, trackUrl)

    const FFT_SIZE = 128
    const [listener] = useState(() => new AudioListener())
    const audio: Audio<GainNode> = useMemo(
        () => new Audio(listener),
        [listener]
    )
    const audioRef = useRef(audio)

    useEffect(() => {
        audioRef.current.setBuffer(buffer)
        audioRef.current.setLoop(true)
        camera.add(listener)
        // return () => camera.remove(listener)
    }, [audio, buffer, camera, listener, trackUrl])

    const analyser = new AudioAnalyser(audioRef.current, FFT_SIZE)

    const format = gl.capabilities.isWebGL2 ? RedFormat : LuminanceFormat

    // create an object for the sound to play from
    const [mesh] = useState(new Mesh())
    const meshRef = useRef<Mesh>(mesh)
    const materialRef = useRef<ShaderMaterial>(null!)

    useFrame(() => {
        // analyser.getFrequencyData() returns array of half size of fftSize.
        // ex. if fftSize = 2048, array size will be 1024.
        // data includes magnitude of low ~ high frequency.
        const frequencyData: Uint8Array = analyser.getFrequencyData()

        materialRef.current.uniforms.mouse.value = mouse
        materialRef.current.uniforms.mouse.value.needsUpdate = true
        materialRef.current.uniforms.tAudioData.value = new DataTexture(
            frequencyData,
            FFT_SIZE / 2,
            1,
            format
        )
        materialRef.current.uniforms.tAudioData.value.needsUpdate = true
        // materialRef.current.uniformsNeedUpdate = true
        // materialRef.current.needsUpdate = true
    })

    return (
        <>
            <Html
                style={{
                    color: 'black',
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    // zIndex: 10,
                }}
            >
                <button
                    style={{
                        paddingBlock: '2px',
                        background: 'none',
                        border: '1px solid',
                        borderRadius: '1px',
                        cursor: 'pointer',
                        fontSize: '1.1em',
                        color: '#ff5b32',
                    }}
                    onClick={() => {
                        playing
                            ? audioRef.current.pause()
                            : audioRef.current.play()
                        setPlaying(!playing)
                    }}
                >
                    {playing ? 'Pause' : 'Play'}
                </button>
                <select
                    style={{
                        paddingBlock: '2px',
                        background: 'none',
                        border: '1px solid',
                        borderRadius: '1px',
                        fontSize: '1.1em',
                        color: '#ff5b32',
                    }}
                    onChange={(e) => {
                        audioRef.current.pause()
                        setPlaying(false)
                        setTrackUrl(`/${e.target.value}.mp3`)
                    }}
                >
                    <option
                        value={musicAsset['james-blake'].name}
                        defaultChecked
                    >
                        {musicAsset['james-blake'].name}
                    </option>
                    <option value={musicAsset['nils-frahn'].name}>
                        {musicAsset['nils-frahn'].name}
                    </option>
                </select>
            </Html>
            <animated.mesh position={position} ref={meshRef} castShadow>
                <sphereBufferGeometry attach="geometry" />
                <shaderMaterial
                    attach="material"
                    ref={materialRef}
                    uniforms-mouse={mouse}
                    uniforms-tAudioData={
                        new DataTexture(analyser.data, FFT_SIZE / 2, 1, format)
                    }
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    alphaTest={0}
                    depthWrite={true}
                    vertexColors={true}
                    // needsUpdate={true}
                    // uniformsNeedUpdate={true}
                />
                <positionalAudio ref={audioRef} args={[listener]} />
            </animated.mesh>
        </>
    )
}

interface SceneProps {}
const Scene: FC<SceneProps> = () => {
    return (
        <group>
            {/* This mesh is the plane (The floor) */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -3, 0]}
                receiveShadow
            >
                <planeBufferGeometry attach="geometry" args={[100, 100]} />
                <shadowMaterial attach="material" opacity={0.3} />
            </mesh>
            <SoundMesh position={[0, 1, 0]} />
        </group>
    )
}

const Demo = () => {
    return (
        <div id="canvas-container">
            <Canvas shadows camera={{ position: [-5, 2, 10], fov: 60 }}>
                <ambientLight intensity={0.3} />
                <directionalLight
                    castShadow
                    position={[0, 10, 0]}
                    intensity={1.5}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    shadow-camera-far={50}
                    shadow-camera-left={-10}
                    shadow-camera-right={10}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-10}
                />
                <pointLight position={[-10, 0, -20]} intensity={0.5} />
                <pointLight position={[0, -10, 0]} intensity={1.5} />

                {/**************** Scene  *************************/}
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
                {/**************** Scene  *************************/}
                <OrbitControls />
            </Canvas>
        </div>
    )
}

export default Demo
