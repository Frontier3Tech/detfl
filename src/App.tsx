import { route } from './routing';
import Enterprise from './components/Enterprise';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <div class="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-800">deTFL</h1>
          <small class="text-gray-600">An asset recovery tool for the post-TFL Terra era</small>
        </div>
      </header>

      {/* Navigation */}
      <nav class="bg-gray-800 text-white">
        <div class="max-w-7xl mx-auto px-4">
          <div class="flex space-x-4 h-10 items-center">
            <a href="#/enterprise">Enterprise</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main class="flex-grow">
        <Routes />
      </main>

      {/* Footer */}
      <footer class="bg-gray-800 text-white">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <div class="flex justify-between items-center text-sm">
            <a href="https://kiruse.dev" target="_blank">deTFL © 2025 Kiruse</a>
            <div class="space-x-4">
              <a href="https://github.com/frontier3tech/detfl" target="_blank">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Routes() {
  switch (route.value) {
    case '':
    case '/':
    case '/enterprise':
      return <Enterprise />;
    default:
      return <NotFound />;
  }
}
