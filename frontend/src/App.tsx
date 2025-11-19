import UrlShortenerForm from './components/UrlShortenerForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-white mb-3 tracking-tight">
            URL <span className="font-normal text-indigo-400">Shortener</span>
          </h1>
          <p className="text-gray-400 text-lg">Transform long URLs into elegant, shareable links</p>
        </div>
        <UrlShortenerForm />
      </div>
    </div>
  );
}

export default App;

