import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/reservations', component: () => import('../views/ReservationsView.vue') },
    { path: '/reservations/:id', component: () => import('../views/ReservationDetailView.vue') },
  ],
})
