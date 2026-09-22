import { Nav } from './components/Nav';
import { Site } from './components/Site';
import { Footer } from './components/Footer';
import { Workspace } from './pages/Workspace';
import { RunDetail } from './pages/RunDetail';
import { Settings } from './pages/Settings';
import { Docs } from './pages/Docs';
import { useRoute } from './hooks/route';
import { useGateway } from './state/connection';
import './index.css';

function SitePage({ go }: { go: (to: string) => void }) {
  return <Site go={go} />;
}

export default function App() {
  const { path, navigate } = useRoute();
  const gw = useGateway();

  if (path === 'app') {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="main">
          <Workspace gw={gw} go={navigate} />
        </main>
        <Footer />
      </>
    );
  }
  if (path.startsWith('tasks/')) {
    const runId = decodeURIComponent(path.slice('tasks/'.length));
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="main">
          {runId ? <RunDetail gw={gw} runId={runId} go={navigate} /> : <Workspace gw={gw} go={navigate} />}
        </main>
        <Footer />
      </>
    );
  }
  if (path === 'settings') {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="main">
          <Settings gw={gw} />
        </main>
        <Footer />
      </>
    );
  }
  if (path === 'docs') {
    return (
      <>
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="main">
          <Docs />
        </main>
        <Footer />
      </>
    );
  }
  return <SitePage go={navigate} />;
}
