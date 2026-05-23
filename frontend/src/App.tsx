import { useEffect } from 'react'
import { AppRouter } from '@/routes/AppRouter'
import { useAuth } from '@/stores/auth'
import '@/App.css'

function App() {
  const { token, refreshMe, hydrated } = useAuth()

  useEffect(() => {
    if (hydrated && token) {
      // verify token still valid + refresh user info
      void refreshMe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  return (
    <div className="App">
      <AppRouter />
    </div>
  )
}

export default App
