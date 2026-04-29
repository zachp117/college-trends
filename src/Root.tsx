import { Component, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import App from './App';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { AboutPage } from './components/AboutPage';
import { parseSchoolPath } from './util/schoolUrl';
import { AUTH_ENABLED } from './util/featureFlags';

type Route = 'landing' | 'auth' | 'app' | 'about';

function pathToRoute(path: string): Route {
  // /school/* and /app/* both render the App; App handles its own subrouting.
  if (parseSchoolPath(path) !== null) return 'app';
  if (path.startsWith('/app')) return 'app';
  // When auth is hidden, treat /login and /signup as the landing page so a
  // direct URL hit doesn't expose the auth form.
  if (AUTH_ENABLED && (path.startsWith('/login') || path.startsWith('/signup'))) return 'auth';
  if (path.startsWith('/about')) return 'about';
  return 'landing';
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
    </Boundary>
  );
}
