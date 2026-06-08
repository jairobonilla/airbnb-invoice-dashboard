<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">Invoice Dashboard</div>
      <nav class="sidebar-nav">
        <RouterLink to="/"><i class="pi pi-home" /> Dashboard</RouterLink>
        <RouterLink to="/reservations"><i class="pi pi-list" /> Reservations</RouterLink>
      </nav>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
