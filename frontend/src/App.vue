<template>
  <div class="app-layout">
    <!-- Mobile top bar -->
    <header class="mobile-header">
      <span class="mobile-logo">Invoice Dashboard</span>
      <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
        <i :class="sidebarOpen ? 'pi pi-times' : 'pi pi-bars'" />
      </button>
    </header>

    <!-- Overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-logo">Invoice Dashboard</div>
      <nav class="sidebar-nav">
        <RouterLink to="/" @click="sidebarOpen = false"><i class="pi pi-home" /> Dashboard</RouterLink>
        <RouterLink to="/reservations" @click="sidebarOpen = false"><i class="pi pi-list" /> Reservations</RouterLink>
      </nav>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sidebarOpen = ref(false)
</script>
