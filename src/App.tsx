import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import PageTransition from '@/components/PageTransition'
import Landing from '@/pages/Landing'
import Legacy from '@/pages/Legacy'
import About from '@/pages/About'
import Personal from '@/pages/Personal'

const Publications = lazy(() => import('@/pages/Publications'))
const Projects = lazy(() => import('@/pages/Projects'))
const Graph = lazy(() => import('@/pages/Graph'))
const CVExport = lazy(() => import('@/pages/CVExport'))
const ResumeExport = lazy(() => import('@/pages/ResumeExport'))

export default function App() {
  return (
    <Layout>
      <PageTransition>{location => (
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/papers" element={<Publications />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<Navigate to="/projects" replace />} />
          <Route path="/graph" element={<Graph />} />
          <Route path="/cv" element={<CVExport />} />
          <Route path="/resume" element={<ResumeExport />} />
          <Route path="/legacy" element={<Legacy />} />
          <Route path="/about" element={<About />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}</PageTransition>
    </Layout>
  )
}
