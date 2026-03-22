import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Graph from '@/pages/Graph'
import Legacy from '@/pages/Legacy'
import CVExport from '@/pages/CVExport'
import ResumeExport from '@/pages/ResumeExport'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/graph" element={<Graph />} />
        <Route path="/legacy" element={<Legacy />} />
        <Route path="/cv" element={<CVExport />} />
        <Route path="/resume" element={<ResumeExport />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
