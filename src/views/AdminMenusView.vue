<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/api/admin'
import type { Menu, MenuLevel } from '@/types'
import { toast } from '@/utils/toast'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Input from '@/components/ui/Input.vue'
import Modal from '@/components/ui/Modal.vue'
import { Plus, Pencil, Trash2, Menu as MenuIcon } from 'lucide-vue-next'

const menus = ref<Menu[]>([])
const editingId = ref<number | null>(null)
const isSaving = ref(false)
const isDeleting = ref(false)
const menuToDelete = ref<Menu | null>(null)

const form = ref({
  parent_id: '',
  code: '',
  name: '',
  path: '',
  icon: 'folder',
  levels: 'view:Read',
})

const roots = computed(() => menus.value.filter((menu) => !menu.parent_id))
const childrenOf = (id: number) => menus.value.filter((menu) => menu.parent_id === id)

async function loadMenus() {
  try {
    const res: any = await adminApi.getMenus(0)
    menus.value = res.data || []
  } catch (err: any) {
    toast.error('Failed to load menus', err?.message)
  }
}

function resetForm() {
  editingId.value = null
  form.value = {
    parent_id: '',
    code: '',
    name: '',
    path: '',
    icon: 'folder',
    levels: 'view:Read',
  }
}

function editMenu(menu: Menu) {
  editingId.value = menu.id
  const levelsFormatted = (menu.levels || [])
    .map((level) => `${level.permission_code || level.code}:${level.name}`)
    .join('\n')

  form.value = {
    parent_id: menu.parent_id ? String(menu.parent_id) : '',
    code: menu.code || '',
    name: menu.name || '',
    path: menu.path || '',
    icon: menu.icon || 'folder',
    levels: levelsFormatted || 'view:Read',
  }
}

function levelPayload(): Partial<MenuLevel>[] {
  if (!form.value.levels) return []
  const baseCode = form.value.code.trim()
  return form.value.levels
    .split(/\n|,/)
    .map((item, index) => {
      const trimmed = item.trim()
      if (!trimmed) return null
      const parts = trimmed.split(':')
      const code = parts[0]?.trim() || ''
      const name = parts[1]?.trim() || code
      if (!code) return null
      const permission = code.includes('.') ? code : (baseCode ? `${baseCode}.${code}` : code)
      return {
        code: baseCode && !code.startsWith(baseCode) ? `${baseCode}.${code}` : code,
        name,
        permission_code: permission,
        sort_order: index,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item && item.name))
}

async function saveMenu() {
  if (!form.value.code.trim() || !form.value.name.trim()) {
    return toast.error('Validation Error', 'Menu code and name are required.')
  }

  isSaving.value = true
  const payload = {
    parent_id: form.value.parent_id ? Number(form.value.parent_id) : null,
    code: form.value.code.trim(),
    name: form.value.name.trim(),
    path: form.value.path.trim(),
    icon: form.value.icon.trim() || 'folder',
    levels: levelPayload(),
  }

  try {
    if (editingId.value) {
      await adminApi.updateMenu(editingId.value, payload)
      toast.success('Menu updated', `${form.value.name} updated successfully.`)
    } else {
      await adminApi.createMenu(payload)
      toast.success('Menu created', `${form.value.name} created successfully.`)
    }
    resetForm()
    await loadMenus()
  } catch (err: any) {
    toast.error('Failed to save menu', err?.message)
  } finally {
    isSaving.value = false
  }
}

function promptDeleteMenu(menu: Menu) {
  menuToDelete.value = menu
}

async function confirmDeleteMenu() {
  if (!menuToDelete.value) return
  isDeleting.value = true
  try {
    await adminApi.deleteMenu(menuToDelete.value.id)
    toast.success('Menu deleted', `${menuToDelete.value.name} has been removed.`)
    menuToDelete.value = null
    await loadMenus()
  } catch (err: any) {
    toast.error('Failed to delete menu', err?.message)
  } finally {
    isDeleting.value = false
  }
}

onMounted(loadMenus)
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-foreground">Menus & Submenus</h1>
        <p class="mt-0.5 text-xs text-muted-foreground">Create the navigation hierarchy and define action levels for each menu.</p>
      </div>
      <Button size="sm" class="gap-1.5 font-medium rounded-md h-8 px-3" @click="resetForm">
        <Plus class="size-3.5" :stroke-width="1.6" />
        New Menu
      </Button>
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card class="overflow-hidden shadow-2xs border border-border">
        <div class="bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">Navigation Tree</div>
        <div class="p-5">
          <div v-for="menu in roots" :key="menu.id" class="mb-3">
            <div class="flex items-center gap-3 rounded-lg bg-muted/40 px-3.5 py-2.5 text-xs text-foreground border border-border/60">
              <MenuIcon class="size-4 text-primary shrink-0" :stroke-width="1.6" />
              <span class="font-medium">{{ menu.name }}</span>
              <code class="ml-auto text-[10px] text-muted-foreground font-mono bg-card px-1.5 py-0.5 rounded border border-border/50">{{ menu.code }}</code>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Edit menu"
                aria-label="Edit menu"
                @click="editMenu(menu)"
              >
                <Pencil class="size-3" :stroke-width="1.6" />
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Delete menu"
                aria-label="Delete menu"
                @click="promptDeleteMenu(menu)"
              >
                <Trash2 class="size-3" :stroke-width="1.6" />
              </button>
            </div>
            <div
              v-for="child in childrenOf(menu.id)"
              :key="child.id"
              class="ml-6 mt-1.5 flex items-center gap-2.5 rounded-md bg-card px-3 py-2 text-xs text-muted-foreground border border-border/40"
            >
              <span class="font-medium text-foreground">{{ child.name }}</span>
              <code class="ml-auto text-[10px] font-mono bg-muted/60 px-1.5 py-0.5 rounded">{{ child.code }}</code>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Edit submenu"
                aria-label="Edit submenu"
                @click="editMenu(child)"
              >
                <Pencil class="size-3" :stroke-width="1.6" />
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Delete submenu"
                aria-label="Delete submenu"
                @click="promptDeleteMenu(child)"
              >
                <Trash2 class="size-3" :stroke-width="1.6" />
              </button>
            </div>
          </div>
          <p v-if="!menus.length" class="p-8 text-center text-xs text-muted-foreground">No menus yet.</p>
        </div>
      </Card>

      <Card class="p-5 shadow-2xs border border-border">
        <h2 class="text-sm font-semibold text-foreground">{{ editingId ? 'Edit Menu' : 'Add Menu or Submenu' }}</h2>
        <div class="mt-4 flex flex-col gap-3">
          <div class="space-y-1">
            <label class="text-[11px] font-medium text-muted-foreground">Menu Name</label>
            <Input v-model="form.name" placeholder="e.g. Analytics" class="h-8 text-xs rounded-md" />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-medium text-muted-foreground">Unique Code</label>
            <Input v-model="form.code" placeholder="e.g. analytics" class="h-8 text-xs rounded-md font-mono" />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-medium text-muted-foreground">Parent Hierarchy</label>
            <select
              v-model="form.parent_id"
              class="h-8 w-full rounded-md border border-border bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:border-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/15 cursor-pointer"
            >
              <option value="">Top-level menu</option>
              <option v-for="menu in roots" :key="menu.id" :value="menu.id">Submenu of {{ menu.name }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-medium text-muted-foreground">Route Path</label>
            <Input v-model="form.path" placeholder="/analytics" class="h-8 text-xs rounded-md font-mono" />
          </div>
          <div class="space-y-1">
            <label class="text-[11px] font-medium text-muted-foreground">Permissions (Levels)</label>
            <textarea
              v-model="form.levels"
              rows="3"
              class="w-full rounded-md border border-border bg-card p-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus-visible:border-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/15 resize-none font-mono"
              placeholder="read:Read&#10;write:Write"
            />
            <p class="text-[10px] leading-relaxed text-muted-foreground">Format: `read:Read`, `write:Write`, `create:Create`, `delete:Delete`.</p>
          </div>
          <div class="flex gap-2 pt-2 border-t border-border">
            <Button size="sm" class="rounded-md font-medium h-8 px-4" :disabled="isSaving" @click="saveMenu">
              {{ isSaving ? 'Saving...' : 'Save menu' }}
            </Button>
            <Button v-if="editingId" size="sm" variant="outline" class="rounded-md h-8" :disabled="isSaving" @click="resetForm">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      :open="!!menuToDelete"
      title="Delete Menu"
      description="This will permanently delete this menu item and its navigation links."
      max-width="max-w-md"
      @close="menuToDelete = null"
    >
      <p class="text-xs text-muted-foreground leading-relaxed">
        Are you sure you want to delete <span class="font-semibold text-foreground">{{ menuToDelete?.name }}</span>? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="outline" size="sm" class="rounded-md h-8" :disabled="isDeleting" @click="menuToDelete = null">
          Cancel
        </Button>
        <Button variant="destructive" size="sm" class="rounded-md h-8 px-4" :disabled="isDeleting" @click="confirmDeleteMenu">
          {{ isDeleting ? 'Deleting...' : 'Delete Menu' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>
