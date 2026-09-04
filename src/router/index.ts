import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { requiresAuth: true, permission: 'project.view' },
  },
  {
    path: '/projects/:id',
    name: 'project-detail',
    component: () => import('@/views/ProjectDetailView.vue'),
    meta: { requiresAuth: true, permission: 'project.view' },
  },
  {
    path: '/my-tasks',
    name: 'my-tasks',
    component: () => import('@/views/MyTasksView.vue'),
    meta: { requiresAuth: true, permission: 'annotation.view' },
  },
  {
    path: '/workspace',
    name: 'workspace',
    component: () => import('@/views/WorkspaceView.vue'),
    meta: { requiresAuth: true, permission: 'annotation.view' },
  },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('@/views/ReviewsView.vue'),
    meta: { requiresAuth: true, permission: 'review.view' },
  },
  {
    path: '/qa',
    name: 'qa',
    component: () => import('@/views/QAView.vue'),
    meta: { requiresAuth: true, permission: 'qa.view' },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/AdminUsersView.vue'),
    meta: { requiresAuth: true, permission: 'user.view' },
  },
  {
    path: '/admin/roles',
    name: 'admin-roles',
    component: () => import('@/views/AdminRolesView.vue'),
    meta: { requiresAuth: true, permission: 'role.update' },
  },
  {
    path: '/admin/menus',
    name: 'admin-menus',
    component: () => import('@/views/AdminMenusView.vue'),
    meta: { requiresAuth: true, permission: 'role.update' },
  },
  {
    path: '/admin/annotation-types',
    name: 'admin-annotation-types',
    component: () => import('@/views/AdminAnnotationTypesView.vue'),
    meta: { requiresAuth: true, permission: 'project.view' },
  },

  {
    path: '/admin/audit-logs',
    name: 'admin-audit-logs',
    component: () => import('@/views/AuditLogsView.vue'),
    meta: { requiresAuth: true, permission: 'audit.view' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    if (authStore.isAuthenticated) {
      return next('/dashboard')
    }
    return next()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.permission && typeof to.meta.permission === 'string') {
    if (!authStore.hasPermission(to.meta.permission)) {
      return next('/dashboard')
    }
  }

  next()
})

export default router
