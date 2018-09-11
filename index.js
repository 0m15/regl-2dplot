const reglInit = require("regl")
const mouseListener = require("mouse-change")

const NUM_POINTS = 1200
const VERT_SIZE = 4 * (4 + 3)

const regl = reglInit({
  extensions: ["OES_standard_derivatives"]
})

const pointBuffer = regl.buffer(
  Array(NUM_POINTS)
    .fill()
    .map(function(p, i) {
      return [
        // position
        (i / NUM_POINTS) * 2 - 1,                   
        Math.random() * 0.5 - 0.5 + i / NUM_POINTS,
        1,
        // size
        Math.random() * 4.0 * Math.PI + 0.1,
        // color
        0.7,
        0.7,
        0.7
      ]
    })
)

const drawParticles = regl({
  vert: `
    precision mediump float;
    attribute vec4 pos, sizes;
    attribute vec3 color;
    uniform float time;
    uniform vec2 mouse;
    varying vec3 fragColor;
    varying float radius;
    varying vec2 m;
    varying float dist;
    void main() {
    vec3 position = pos.xyz;
    radius = pos.w;
    float l = length(mouse - pos.xy);

    if (l < 0.05) {
        gl_PointSize = radius * (2.0 - l);
        gl_Position = vec4(mouse, 0, 1);
    } else {
        gl_PointSize = radius;
        gl_Position = vec4(position, 1);
    }
    
    fragColor = color;
    dist = l;
    }`,

  frag: `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision lowp float;
    varying vec3 fragColor;
    varying float radius;
    varying float dist;

    void main() {
    float r = radius, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
    delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif
    gl_FragColor = vec4(fragColor, alpha);
    }`,

  attributes: {
    pos: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 0
    },
    color: {
      buffer: pointBuffer,
      stride: VERT_SIZE,
      offset: 16
    }
  },

  depth: {
    enable: false
  },

  blend: {
    enable: true,
    func: {
      srcRGB: "src alpha",
      srcAlpha: "src alpha",
      dstRGB: "one minus src alpha",
      dstAlpha: "one minus src alpha"
    }
  },

  uniforms: {
    time: ({ tick }) => tick * 0.001,
    mouse: ({ pixelRatio, viewportHeight, viewportWidth }) => {
      return [
        ((this.mouse.x * pixelRatio) / viewportWidth) * 2 - 1,
        ((viewportHeight - this.mouse.y * pixelRatio) / viewportHeight) * 2 - 1
      ]
    }
  },

  count: NUM_POINTS,

  primitive: "points"
})

const drawMouseCursor = regl({
  vert: `
    precision mediump float;
    attribute vec2 position;
    uniform vec2 mouse;
    varying vec3 fragColor;

    void main() {
    gl_PointSize = 42.0;
    fragColor = vec3(0.8, 0.3, 0.1);
    gl_Position = vec4(vec2(mouse), 0, 1.0);
    }
    `,
  frag: `
    #ifdef GL_OES_standard_derivatives
    #extension GL_OES_standard_derivatives : enable
    #endif
    precision mediump float;
    varying vec3 fragColor;
    void main() {
    float r = 42.0, delta = 0.0, alpha = 1.0;
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);

    #ifdef GL_OES_standard_derivatives
    delta = fwidth(r);
    alpha = 0.3 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif
    gl_FragColor = vec4(fragColor, alpha);
    }
    `,
  depth: {
    enable: true
  },
  blend: {
    enable: true,
    func: {
      srcRGB: "src alpha",
      srcAlpha: "src alpha",
      dstRGB: "one minus src alpha",
      dstAlpha: "one minus src alpha"
    },
    equation: {
      rgb: "subtract",
      alpha: "subtract"
    }
  },
  attributes: {
    position: [0, 0]
  },
  uniforms: {
    mouse: ({ pixelRatio, viewportHeight, viewportWidth }) => {
      return [
        ((this.mouse.x * pixelRatio) / viewportWidth) * 2 - 1,
        ((viewportHeight - this.mouse.y * pixelRatio) / viewportHeight) * 2 - 1
      ]
    }
  },
  count: 1,
  primitive: "points"
})

regl.frame(() => {
  regl.clear({
    depth: 1,
    color: [1, 1, 1, 0]
  })
  drawMouseCursor()
  drawParticles()
})
