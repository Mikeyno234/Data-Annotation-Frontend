<script setup lang="ts">
import { reactive } from 'vue'
import { useTheme } from '@/stores/theme'
import { toast } from '@/utils/toast'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import Button from '@/components/ui/Button.vue'
import { Sun, Moon, Zap, Save, Check } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()

const savedPrefs = localStorage.getItem('annotation_user_preferences') || localStorage.getItem('matrix_user_preferences')
const preferences = reactive(
  savedPrefs
    ? JSON.parse(savedPrefs)
    : {
        autoAdvance: true,
        defaultPlaybackSpeed: 1.0,
        autoPlayOnLoad: false,
        showConfidenceScores: true,
        autoSaveDraftInterval: 30,
      }
)

function savePreferences() {
  localStorage.setItem('annotation_user_preferences', JSON.stringify(preferences))
  toast.success('Preferences saved', 'Your workspace customization settings have been updated.')
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Visual Appearance -->
    <Card class="bg-card/90 shadow-sm">
      <div class="px-6 py-4">
        <h2 class="text-sm font-bold text-foreground">Visual Theme</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Customize application appearance for high-contrast annotation.</p>
      </div>

      <CardContent class="p-6 pt-2 flex flex-col gap-4">
        <div class="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/40">
          <div class="flex items-center gap-3">
            <div class="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sun v-if="theme === 'light'" class="size-4" />
              <Moon v-else class="size-4" />
            </div>
            <div>
              <div class="text-xs font-bold text-foreground">Theme Mode</div>
              <div class="text-[11px] text-muted-foreground">Currently using {{ theme }} mode</div>
            </div>
          </div>
          <Button variant="outline" size="sm" class="rounded-xl text-xs font-semibold gap-1.5 h-8" @click="toggleTheme">
            <span>Switch to {{ theme === 'dark' ? 'Light' : 'Dark' }}</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Annotation Workspace Defaults -->
    <Card class="bg-card/90 shadow-sm">
      <div class="px-6 py-4">
        <h2 class="text-sm font-bold text-foreground">Workspace Controls</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Default settings for audio waveform and video canvas engines.</p>
      </div>

      <CardContent class="p-6 pt-2 flex flex-col gap-4 text-xs">
        <div class="flex items-center justify-between py-2 border-b border-border/40">
          <div>
            <div class="font-bold text-foreground">Auto-Advance to Next Item</div>
            <div class="text-[11px] text-muted-foreground">Jump to next pending item after submitting</div>
          </div>
          <input
            v-model="preferences.autoAdvance"
            type="checkbox"
            class="size-4 rounded accent-primary cursor-pointer"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-border/40">
          <div>
            <div class="font-bold text-foreground">Show AI Pre-label Confidence</div>
            <div class="text-[11px] text-muted-foreground">Display % badges on bounding boxes and spans</div>
          </div>
          <input
            v-model="preferences.showConfidenceScores"
            type="checkbox"
            class="size-4 rounded accent-primary cursor-pointer"
          />
        </div>

        <div class="flex items-center justify-between py-2 border-b border-border/40">
          <div>
            <div class="font-bold text-foreground">Default Playback Speed</div>
            <div class="text-[11px] text-muted-foreground">Playback rate for audio and video tools</div>
          </div>
          <select
            v-model="preferences.defaultPlaybackSpeed"
            class="rounded-xl border border-border/50 bg-muted/60 px-2 py-1 text-xs font-semibold text-foreground cursor-pointer"
          >
            <option :value="0.5">0.5x</option>
            <option :value="0.75">0.75x</option>
            <option :value="1.0">1.0x (Normal)</option>
            <option :value="1.25">1.25x</option>
            <option :value="1.5">1.5x</option>
            <option :value="2.0">2.0x</option>
          </select>
        </div>

        <div class="pt-3 flex justify-end">
          <Button size="sm" class="gap-1.5 text-xs rounded-xl font-semibold shadow-xs h-8 px-3" @click="savePreferences">
            <Save class="size-3.5" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
