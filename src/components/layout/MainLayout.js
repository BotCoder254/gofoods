import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>

      {/* Sidebar - Mobile */}
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onSearch={setSearchQuery} />
        
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet context={{ searchQuery }} />
          </div>
        </main>

        {/* Bottom Navigation - Mobile */}
        <BottomNav />
      </div>
    </div>
  )
}

export default MainLayout
