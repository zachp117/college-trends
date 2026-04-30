import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import App from './App';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { AboutPage } from './components/AboutPage';
import { NotFoundPage } from './components/NotFoundPage';
import { parseSchoolPath } from './util/schoolUrl';
import { AUTH_ENABLED } from './util/featureFlags';

type Route = 'landing' | 'auth' | 'app' | 'about' | 'notfound';

/**
 * Match a path against a route prefix. Returns true for exactly the prefix
 * or any sub-path (so `/app` and `/app/students/1` both match `/app`), but
 * not for `/application`. We strip query/hash before passing in, so this
 * only sees the path component.
 */
function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix + '/');
}

function pathToRoute(path: string): Route {
  // Strip query string and hash; normalize trailing slash.
  const [pathOnly = '/'] = path.split(/[?#]/);
  const clean = pathOnly.replace(/\/+$/, '') || '/';

  if (clean === '/') return 'landing';
  // /school/<id> or /school/<slug>-<id>
  if (parseSchoolPath(clean) !== null) return 'app';
  // App and its subroutes (e.g. /app, /app/students/<id>)
  if (isUnder(clean, '/app')) return 'app';
  if (isUnder(clean, '/about')) return 'about';
  // Auth surface is flag-gated: when hidden in prod, /login and /signup 404.
  if (AUTH_ENABLED && (isUnder(clean, '/login') || isUnder(clean, '/signup'))) {
    return 'auth';
  }
  return 'notfound';
}

interface BoundaryState {
  error: Error | null;
}

class Boundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: unknown) {
    console.error('Render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#b91c1c' }}>Something broke during render</h2>
          <p>{this.state.error.message}</p>
          <pre style={{ fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Root() {
  const [route, setRoute] = useState<Route>(() => pathToRoute(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    setRoute(pathToRoute(path));
  };

  return (
    <Boundary>
      {route === 'app' && <App />}
      {route === 'about' && <AboutPage onBack={() => navigate('/app')} />}
      {route === 'auth' && <AuthPage onSuccess={() => navigate('/app')} />}
      {route === 'landing' && (
        <LandingPage
          onEnterApp={() => navigate('/app')}
          onSignIn={() => navigate('/login')}
        />
      )}
      {route === 'notfound' && (
        <NotFoundPage
          onGoHome={() => navigate('/')}
          onGoApp={() => navigate('/app')}
        />
      )}
    </Boundary>
  );
}
