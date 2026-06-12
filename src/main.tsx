import { Component, type ErrorInfo, type ReactNode, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  errorMessage: string | null
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    errorMessage: null,
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      errorMessage:
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo)
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
          }}
        >
          <section
            style={{
              width: 'min(680px, 100%)',
              padding: '24px',
              borderRadius: '24px',
              background: 'rgba(255, 248, 238, 0.96)',
              border: '1px solid rgba(126, 93, 58, 0.18)',
              boxShadow: '0 16px 40px rgba(75, 60, 44, 0.12)',
              color: '#3f3027',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, color: '#8b6b39' }}>
              앱 화면을 불러오는 중 문제가 생겼습니다
            </p>
            <h1 style={{ margin: '12px 0 16px', fontSize: '2rem' }}>마음체크 오류 안내</h1>
            <p style={{ margin: 0, lineHeight: 1.7 }}>
              새로고침 후 다시 시도해 주세요. 계속 같은 화면이 보이면 아래 오류 문구를
              알려주시면 바로 수정하겠습니다.
            </p>
            <pre
              style={{
                margin: '18px 0 0',
                padding: '16px',
                borderRadius: '18px',
                background: '#fffdf8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '0.95rem',
              }}
            >
              {this.state.errorMessage}
            </pre>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

window.addEventListener('error', (event) => {
  console.error('Window error:', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
