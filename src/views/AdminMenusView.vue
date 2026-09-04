<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/api/admin'
import type { Menu, MenuLevel } from '@/types'
import { toast } from '@/utils/toast'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { Plus, Pencil, Trash2, Menu as MenuIcon } from 'lucide-vue-next'

const menus = ref<Menu[]>([])
const editingId = ref<number | null>(null)
const form = ref({ parent_id: '', code: '', name: '', path: '', icon: 'folder', levels: 'view:Read' })
const roots = computed(() => menus.value.filter((menu) => !menu.parent_id))
const childrenOf = (id: number) => menus.value.filter((menu) => menu.parent_id === id)

async function loadMenus() {
  try { const res: any = await adminApi.getMenus(0); menus.value = res.data || [] }
  catch (err: any) { toast.error('Failed to load menus', err?.message) }
}
function resetForm() { editingId.value = null; form.value = { parent_id: '', code: '', name: '', path: '', icon: 'folder', levels: 'view:Read' } }
function editMenu(menu: Menu) { editingId.value = menu.id; form.value = { parent_id: menu.parent_id?.toString() || '', code: menu.code, name: menu.name, path: menu.path, icon: menu.icon || 'folder', levels: menu.levels.map((level) => `${level.permission_code || level.code}:${level.name}`).join('\n') } }
function levelPayload(): Partial<MenuLevel>[] { return form.value.levels.split(/\n|,/).map((item, index) => { const [code, name] = item.split(':'); const permission = code.includes('.') ? code : `${form.value.code}.${code}`; return { code: `${form.value.code}.${code}`, name: name?.trim() || code, permission_code: permission, sort_order: index } }).filter((item) => item.name) }
async function saveMenu() {
  if (!form.value.code || !form.value.name) return toast.error('Menu code and name are required')
  const payload = { parent_id: form.value.parent_id ? Number(form.value.parent_id) : null, code: form.value.code, name: form.value.name, path: form.value.path, icon: form.value.icon, levels: levelPayload() }
  try { if (editingId.value) await adminApi.updateMenu(editingId.value, payload); else await adminApi.createMenu(payload); toast.success('Menu saved'); resetForm(); await loadMenus() }
  catch (err: any) { toast.error('Failed to save menu', err?.message) }
}
async function deleteMenu(menu: Menu) {
  if (!window.confirm(`Delete ${menu.name}?`)) return
  try { await adminApi.deleteMenu(menu.id); toast.success('Menu deleted'); await loadMenus() }
  catch (err: any) { toast.error('Failed to delete menu', err?.message) }
}
onMounted(loadMenus)
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Menus & Submenus</h1>
        <p class="mt-1 text-xs text-muted-foreground">Create the navigation hierarchy and define action levels for each menu.</p>
      </div>
      <Button class="gap-2 font-semibold shadow-md rounded-xl h-10 px-4" @click="resetForm"><Plus class="size-4" />New Menu</Button>
    </div>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card class="overflow-hidden bg-card/90 shadow-sm">
        <div class="bg-muted/30 px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Navigation Tree</div>
        <div class="p-5">
          <div v-for="menu in roots" :key="menu.id" class="mb-3">
            <div class="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-foreground shadow-xs">
              <MenuIcon class="size-4 text-primary" />
              <span class="font-bold">{{ menu.name }}</span>
              <code class="ml-auto text-[10px] text-muted-foreground font-mono bg-card px-2 py-0.5 rounded-lg shadow-xs">{{ menu.code }}</code>
              <button class="text-muted-foreground hover:text-primary p-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer" @click="editMenu(menu)"><Pencil class="size-3.5" /></button>
              <button class="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer" @click="deleteMenu(menu)"><Trash2 class="size-3.5" /></button>
            </div>
            <div v-for="child in childrenOf(menu.id)" :key="child.id" class="ml-8 mt-2 flex items-center gap-3 rounded-xl bg-card px-4 py-2.5 text-xs text-muted-foreground shadow-xs">
              <span class="font-semibold text-foreground">{{ child.name }}</span>
              <code class="ml-auto text-[10px] font-mono bg-muted/60 px-2 py-0.5 rounded">{{ child.code }}</code>
              <button class="text-muted-foreground hover:text-primary p-1 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer" @click="editMenu(child)"><Pencil class="size-3.5" /></button>
              <button class="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer" @click="deleteMenu(child)"><Trash2 class="size-3.5" /></button>
            </div>
          </div>
          <p v-if="!menus.length" class="p-8 text-center text-xs text-muted-foreground">No menus yet.</p>
        </div>
      </Card>
      <Card class="p-6 bg-card/90 shadow-sm">
        <h2 class="text-base font-bold text-foreground">{{ editingId ? 'Edit Menu' : 'Add Menu or Submenu' }}</h2>
        <div class="mt-4 flex flex-col gap-3.5">
          <input v-model="form.name" class="h-10 rounded-xl border-0 bg-muted/60 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner" placeholder="Menu name" />
          <input v-model="form.code" class="h-10 rounded-xl border-0 bg-muted/60 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner font-mono" placeholder="Unique code, e.g. reports" />
          <select v-model="form.parent_id" class="h-10 rounded-xl border-0 bg-muted/60 px-3.5 text-xs text-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner cursor-pointer">
            <option value="">Top-level menu</option>
            <option v-for="menu in roots" :key="menu.id" :value="menu.id">Submenu of {{ menu.name }}</option>
          </select>
          <input v-model="form.path" class="h-10 rounded-xl border-0 bg-muted/60 px-3.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-inner font-mono" placeholder="Route path, e.g. /reports" />
          <textarea v-model="form.levels" rows="3" class="rounded-xl border-0 bg-muted/60 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none shadow-inner font-mono" placeholder="Permission:Label, one per line" />
          <p class="text-[10px] leading-relaxed text-muted-foreground">Levels format: `read:Read`, `write:Write`, `create:Create`, `delete:Delete`. Permission codes are generated from the menu code.</p>
          <div class="flex gap-2.5 pt-2">
            <Button class="rounded-xl font-semibold h-10 px-5" @click="saveMenu">Save menu</Button>
            <Button v-if="editingId" variant="outline" class="rounded-xl h-10" @click="resetForm">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
