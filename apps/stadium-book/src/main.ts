import ElementPlus from "element-plus"
import { createPinia } from "pinia"
import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import "./router/permission"
import "element-plus/dist/index.css"
import "./styles/reset.scss"
import "virtual:uno.css"

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router).use(ElementPlus).mount("#app")
