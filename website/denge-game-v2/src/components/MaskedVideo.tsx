import { useCallback, useEffect, useRef, useState } from 'react';

type MaskedVideoProps = {
  src: string;
  poster: string;
  muted: boolean;
};

type PlaybackStatus = 'loading' | 'playing' | 'paused' | 'blocked' | 'ended' | 'error';

function createRenderer(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL unavailable');
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Shader allocation failed');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Shader compilation failed');
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, `
    attribute vec2 position;
    varying vec2 uv;
    void main() { uv = (position + 1.0) * 0.5; gl_Position = vec4(position, 0.0, 1.0); }
  `);
  const fragment = compile(gl.FRAGMENT_SHADER, `
    precision highp float;
    uniform sampler2D frame;
    varying vec2 uv;
    void main() {
      vec3 color = texture2D(frame, vec2(uv.x * 0.5, uv.y)).rgb;
      float mask = texture2D(frame, vec2(0.5 + uv.x * 0.5, uv.y)).r;
      gl_FragColor = vec4(color, clamp((mask - 0.02) / 0.96, 0.0, 1.0));
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error('Program allocation failed');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!buffer || !texture) throw new Error('Video texture allocation failed');
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.uniform1i(gl.getUniformLocation(program, 'frame'), 0);
  return {
    draw() {
      if (video.readyState < 2 || !video.videoWidth) return false;
      const width = video.videoWidth / 2;
      if (canvas.width !== width || canvas.height !== video.videoHeight) {
        canvas.width = width;
        canvas.height = video.videoHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

export default function MaskedVideo({ src, poster, muted }: MaskedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderingFailedRef = useRef(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [renderingFailed, setRenderingFailed] = useState(false);
  const [status, setStatus] = useState<PlaybackStatus>('loading');

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || renderingFailedRef.current) return;
    setStatus('loading');
    void video.play().catch((error: unknown) => {
      if (videoRef.current !== video) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error');
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    let renderer: ReturnType<typeof createRenderer> | undefined;
    let frameId = 0;
    let firstFrame = true;
    let stopped = false;
    const useVideoFrames = typeof video.requestVideoFrameCallback === 'function';
    const fail = () => {
      stopped = true;
      renderingFailedRef.current = true;
      setRenderingFailed(true);
      video.pause();
    };
    const draw = () => {
      if (stopped) return;
      try {
        if (renderer?.draw() && firstFrame) {
          firstFrame = false;
          setHasFrame(true);
        }
      } catch {
        fail();
      }
    };
    const nextFrame = () => {
      draw();
      if (!stopped) frameId = useVideoFrames ? video.requestVideoFrameCallback(nextFrame) : requestAnimationFrame(nextFrame);
    };
    const contextLost = (event: Event) => { event.preventDefault(); fail(); };
    try {
      renderingFailedRef.current = false;
      renderer = createRenderer(canvas, video);
      nextFrame();
    } catch {
      fail();
    }
    canvas.addEventListener('webglcontextlost', contextLost);
    video.addEventListener('loadeddata', draw);
    video.addEventListener('seeked', draw);
    play();
    return () => {
      stopped = true;
      video.pause();
      if (useVideoFrames) video.cancelVideoFrameCallback(frameId);
      else cancelAnimationFrame(frameId);
      video.removeEventListener('loadeddata', draw);
      video.removeEventListener('seeked', draw);
      canvas.removeEventListener('webglcontextlost', contextLost);
      renderer?.dispose();
    };
  }, [play]);

  return (
    <>
      <div className="lina-video-layer" role="img" aria-label="Lina konuşarak kasabayı tanıtıyor">
        <img src={poster} alt="" />
        <canvas ref={canvasRef} className={hasFrame && !renderingFailed ? 'is-ready' : ''} aria-hidden="true" />
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          playsInline
          preload="auto"
          className="masked-video-source"
          aria-hidden="true"
          onPlaying={() => setStatus('playing')}
          onPause={() => setStatus((previous) => previous === 'playing' ? 'paused' : previous)}
          onWaiting={() => setStatus('loading')}
          onEnded={() => setStatus('ended')}
          onError={() => setStatus('error')}
        />
      </div>
      {!renderingFailed && ['playing', 'paused', 'ended'].includes(status) && (
        <div className="lina-playback-controls">
          <button className="startup-button startup-button-glass" onClick={() => {
            if (status === 'playing') videoRef.current?.pause();
            else {
              if (status === 'ended' && videoRef.current) videoRef.current.currentTime = 0;
              play();
            }
          }}>
            {status === 'playing' ? 'Duraklat' : status === 'ended' ? 'Tekrar dinle' : 'Devam et'}
          </button>
        </div>
      )}
      {status === 'loading' && !renderingFailed && <p className="intro-loading" role="status">Lina hazırlanıyor…</p>}
      {(renderingFailed || status === 'blocked' || status === 'error') && (
        <div className="intro-fallback">
          <p role="status">
            {renderingFailed ? 'Bu tarayıcı Lina’nın animasyonunu gösteremiyor. Kasabaya geçebilir veya başka bir tarayıcı deneyebilirsin.'
              : status === 'blocked' ? 'Lina’yı dinlemek için oynat düğmesine dokun.'
                : 'Lina’nın videosu yüklenemedi. Yeniden deneyebilir veya kasabaya geçebilirsin.'}
          </p>
          {!renderingFailed && <button className="startup-button startup-button-primary" onClick={() => {
            if (status === 'error') videoRef.current?.load();
            play();
          }}>{status === 'blocked' ? 'Lina’yı dinle' : 'Yeniden dene'}</button>}
        </div>
      )}
    </>
  );
}
