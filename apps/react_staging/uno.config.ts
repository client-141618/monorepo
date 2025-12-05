import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';
export default defineConfig({
 presets: [
   presetUno(),
   presetAttributify(),
   presetIcons(),
 ],
 shortcuts: {
 },
 safelist: ['text-red-500', 'bg-green-500'],
});