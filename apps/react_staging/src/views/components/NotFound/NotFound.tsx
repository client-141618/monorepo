import React from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.code}>404</h1>
        <p style={styles.message}>抱歉，您访问的页面不存在或已被移除。</p>
        <p style={styles.tip}>请检查地址是否正确，或返回主页继续浏览。</p>
        <Button type="primary" onClick={() => navigate('/')}>返回主页</Button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '24px',
    boxSizing: 'border-box',
  },
  content: {
    maxWidth: '480px',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '40px 32px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  },
  code: {
    fontSize: '96px',
    margin: '0 0 16px',
    color: '#ff4d4f',
  },
  message: {
    fontSize: '18px',
    margin: '0 0 12px',
    color: '#333',
  },
  tip: {
    fontSize: '14px',
    margin: '0 0 12px 0',
    color: '#666',
  },
}
