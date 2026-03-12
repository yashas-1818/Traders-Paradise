import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface TickerData {
  nifty: string; niftyUp: boolean;
  sensex: string; sensexUp: boolean;
  reliance: string; relianceUp: boolean;
  volume: string;
}

function useLiveTickers() {
  const [tickers, setTickers] = useState<TickerData>({
    nifty: '+1.12%', niftyUp: true,
    sensex: '+0.98%', sensexUp: true,
    reliance: '₹2,876', relianceUp: true,
    volume: '₹18,432 Cr',
  });

  async function fetchTickers() {
    try {
      const [niftyRes, sensexRes, relianceRes] = await Promise.all([
        fetch('https://traders-paradise-3.onrender.com/yahoo-finance/v8/finance/chart/%5ENSEI'),
        fetch('https://traders-paradise-3.onrender.com/yahoo-finance/v8/finance/chart/%5EBSESN'),
        fetch('https://traders-paradise-3.onrender.com/yahoo-finance/v8/finance/chart/RELIANCE.NS'),
      ]);
      const [niftyData, sensexData, relianceData] = await Promise.all([
        niftyRes.json(), sensexRes.json(), relianceRes.json(),
      ]);
      const parse = (data: any) => {
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return null;
        const price: number = meta.regularMarketPrice;
        const prev: number = meta.chartPreviousClose ?? meta.previousClose;
        const pct = ((price - prev) / prev) * 100;
        return { price, pct, up: pct >= 0 };
      };
      const n = parse(niftyData), s = parse(sensexData), r = parse(relianceData);
      setTickers(prev => ({
        nifty:      n ? (n.up ? '+' : '') + n.pct.toFixed(2) + '%' : prev.nifty,
        niftyUp:    n?.up ?? prev.niftyUp,
        sensex:     s ? (s.up ? '+' : '') + s.pct.toFixed(2) + '%' : prev.sensex,
        sensexUp:   s?.up ?? prev.sensexUp,
        reliance:   r ? '₹' + r.price.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : prev.reliance,
        relianceUp: r?.up ?? prev.relianceUp,
        volume: '₹18,432 Cr',
      }));
    } catch { /* keep previous values */ }
  }

  useEffect(() => {
    fetchTickers();
    const id = setInterval(fetchTickers, 10000);
    return () => clearInterval(id);
  }, []);

  return tickers;
}

interface LightningProps {
  hue?: number; xOffset?: number; speed?: number; intensity?: number; size?: number;
}

const Lightning: React.FC<LightningProps> = ({ hue=230, xOffset=0, speed=1, intensity=1, size=1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
    resize(); window.addEventListener('resize', resize);
    const gl = canvas.getContext('webgl'); if (!gl) return;
    const vs = `attribute vec2 aPosition; void main(){gl_Position=vec4(aPosition,0,1);}`;
    const fs = `precision mediump float;
      uniform vec2 iResolution; uniform float iTime,uHue,uXOffset,uSpeed,uIntensity,uSize;
      #define OC 10
      vec3 hsv2rgb(vec3 c){vec3 r=clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);return c.z*mix(vec3(1),r,c.y);}
      float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}
      float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
      mat2 r2d(float t){return mat2(cos(t),-sin(t),sin(t),cos(t));}
      float ns(vec2 p){vec2 i=floor(p),f=fract(p);float a=h12(i),b=h12(i+vec2(1,0)),c=h12(i+vec2(0,1)),d=h12(i+vec2(1,1));vec2 t=smoothstep(0.,1.,f);return mix(mix(a,b,t.x),mix(c,d,t.x),t.y);}
      float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<OC;i++){v+=a*ns(p);p*=r2d(.45);p*=2.;a*=.5;}return v;}
      void main(){vec2 uv=gl_FragCoord.xy/iResolution;uv=2.*uv-1.;uv.x*=iResolution.x/iResolution.y;uv.x+=uXOffset;uv+=2.*fbm(uv*uSize+.8*iTime*uSpeed)-1.;float d=abs(uv.x);vec3 col=hsv2rgb(vec3(uHue/360.,.7,.8))*pow(mix(0.,.07,h11(iTime*uSpeed))/d,1.)*uIntensity;gl_FragColor=vec4(col,1);}`;
    const mk = (src: string, type: number) => { const s=gl.createShader(type)!; gl.shaderSource(s,src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(vs, gl.VERTEX_SHADER));
    gl.attachShader(prog, mk(fs, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog,'aPosition');
    gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap,2,gl.FLOAT,false,0,0);
    const uR=gl.getUniformLocation(prog,'iResolution'), uT=gl.getUniformLocation(prog,'iTime'),
          uH=gl.getUniformLocation(prog,'uHue'), uX=gl.getUniformLocation(prog,'uXOffset'),
          uSp=gl.getUniformLocation(prog,'uSpeed'), uIn=gl.getUniformLocation(prog,'uIntensity'),
          uSz=gl.getUniformLocation(prog,'uSize');
    const t0=performance.now(); let id: number;
    const render = () => {
      resize(); gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(uR,canvas.width,canvas.height);
      gl.uniform1f(uT,(performance.now()-t0)/1000);
      gl.uniform1f(uH,hue); gl.uniform1f(uX,xOffset); gl.uniform1f(uSp,speed);
      gl.uniform1f(uIn,intensity); gl.uniform1f(uSz,size);
      gl.drawArrays(gl.TRIANGLES,0,6); id=requestAnimationFrame(render);
    };
    id=requestAnimationFrame(render);
    return () => { window.removeEventListener('resize',resize); cancelAnimationFrame(id); };
  }, [hue, xOffset, speed, intensity, size]);
  return <canvas ref={canvasRef} className="w-full h-full" />;
};

interface FeatureItemProps {
  name: string; value: string; up?: boolean; position: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ name, value, up=true, position }) => (
  <motion.div
    className={`absolute ${position} z-30 group cursor-pointer`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center w-3 h-3">
        <div className={`absolute w-3 h-3 rounded-full blur-[2px] transition-all duration-300 ${up ? 'bg-hero-accent/60 group-hover:bg-hero-accent' : 'bg-red-500/60 group-hover:bg-red-500'}`} />
        <div className={`w-1.5 h-1.5 rounded-full relative z-10 ${up ? 'bg-hero-accent' : 'bg-red-500'}`} />
      </div>
      <div className="relative">
        <p className="text-xs font-medium text-hero-text-muted group-hover:text-hero-text transition-colors duration-300">{name}</p>
        <p className={`text-sm font-bold ${up ? 'text-hero-text' : 'text-red-400'}`}>{value}</p>
      </div>
    </div>
  </motion.div>
);

export const HeroSection: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tickers = useLiveTickers();
  const { user, logout } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-hero-bg">
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Navbar ── */}
        <nav className="relative z-40 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">

            {/* Logo */}
            <motion.div
              className="flex items-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="38" height="38">
                <defs>
                  <radialGradient id="bgGrad" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" style={{stopColor:'#0D2010'}}/>
                    <stop offset="100%" style={{stopColor:'#050A05'}}/>
                  </radialGradient>
                  <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <circle cx="100" cy="100" r="90" fill="url(#bgGrad)"/>
                <circle cx="100" cy="100" r="90" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeOpacity="0.25"/>
                <rect x="42" y="62" width="52" height="16" rx="3" fill="white"/>
                <rect x="42" y="62" width="16" height="48" rx="3" fill="white"/>
                <polygon points="128,62 113,88 125,88 110,116 148,86 133,86 146,62" fill="#4ADE80" filter="url(#softGlow)"/>
              </svg>
            </motion.div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8 text-sm text-hero-text-muted">
              {[['Markets','/markets'],['Trading','/trading'],['Portfolio','/portfolio'],['Research','/research'],['Prediction ✦','/prediction'],['Docs','/docs']].map(([label,to]) => (
                <motion.div key={to} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link
                    to={to}
                    className={to === '/prediction'
                      ? 'text-hero-accent/80 hover:text-hero-accent font-semibold transition-colors'
                      : 'hover:text-hero-text transition-colors'
                    }
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Auth area */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-hero-text-muted">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm px-4 py-2 rounded-lg border border-hero-border text-hero-text-muted hover:text-hero-text hover:border-hero-accent/40 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/signup"
                  className="hidden md:inline-block text-sm px-4 py-2 bg-hero-accent text-hero-bg font-semibold rounded-lg hover:bg-hero-accent/80 transition-colors"
                >
                  Get Started
                </Link>
              )}
              <button className="md:hidden text-hero-text-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 6h16M4 18h16"/></svg>
                }
              </button>
            </div>

          </div>
        </nav>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-hero-surface/95 backdrop-blur-md border-b border-hero-border z-50 relative"
            >
              <div className="flex flex-col items-center gap-4 py-6 text-sm">
                <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 text-hero-text-muted">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                {[['Markets','/markets'],['Trading','/trading'],['Portfolio','/portfolio'],['Research','/research'],['Prediction ✦','/prediction'],['Docs','/docs']].map(([l,t]) => (
                  <Link
                    key={t}
                    to={t}
                    className={t === '/prediction'
                      ? 'text-hero-accent font-semibold hover:text-hero-accent/80 transition-colors'
                      : 'text-hero-text-muted hover:text-hero-text transition-colors'
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {l}
                  </Link>
                ))}
                {user ? (
                  <>
                    <span className="text-hero-text-muted text-sm">{user.name}</span>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="px-4 py-2 rounded-lg border border-hero-border text-hero-text-muted">Logout</button>
                  </>
                ) : (
                  <Link to="/signup" className="px-4 py-2 bg-hero-accent text-hero-bg font-semibold rounded-lg" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Live tickers ── */}
        <FeatureItem name="NIFTY 50"  value={tickers.nifty}    up={tickers.niftyUp}    position="top-[30%] left-[8%]" />
        <FeatureItem name="SENSEX"    value={tickers.sensex}   up={tickers.sensexUp}   position="top-[25%] right-[10%]" />
        <FeatureItem name="RELIANCE"  value={tickers.reliance} up={tickers.relianceUp} position="bottom-[30%] left-[5%]" />
        <FeatureItem name="Volume"    value={tickers.volume}   up={true}               position="bottom-[25%] right-[8%]" />

        {/* ── Hero content ── */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-20"
          variants={containerVariants} initial="hidden" animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Link
              to="/markets"
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-hero-border bg-hero-surface/50 backdrop-blur-sm hover:border-hero-accent/40 hover:bg-hero-surface/80 transition-all duration-300"
            >
              <span className="text-xs text-hero-text-muted">Trade smarter with real-time data</span>
              <motion.svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="text-hero-accent"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </Link>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-bold text-hero-text tracking-tight">
            Traders Paradise
          </motion.h1>

          <motion.p variants={itemVariants} className="text-2xl md:text-3xl lg:text-4xl font-light text-hero-text-muted mt-2">
            Lighting Up The Future
          </motion.p>

          <motion.p variants={itemVariants} className="max-w-xl text-hero-text-muted/70 mt-6 text-sm md:text-base">
            Built for the next generation of traders who demand speed, precision, and insight.
            Real-time data, powerful analytics, and seamless execution.
          </motion.p>

          <motion.div variants={itemVariants} className="flex items-center gap-4 mt-8">
            <Link
              to="/trading"
              className="inline-block px-8 py-3 bg-hero-accent text-hero-bg font-semibold rounded-lg hover:bg-hero-accent/80 transition-colors text-sm"
            >
              Start Trading Now
            </Link>
            <Link
              to="/prediction"
              className="inline-block px-6 py-3 border border-hero-accent/30 text-hero-accent font-semibold rounded-lg hover:bg-hero-accent/10 transition-colors text-sm"
            >
              🔮 Try Prediction
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Background ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-hero-bg/40 z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-hero-accent/5 blur-[120px] z-0" />
        <div className="absolute inset-0 z-5">
          <Lightning hue={220} xOffset={0} speed={0.8} intensity={1.2} size={1} />
        </div>
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-t from-hero-accent/10 to-transparent blur-sm z-5 opacity-30" />
      </div>
    </div>
  );
};
