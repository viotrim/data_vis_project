import { createApp } from "vue";
import App from "./App.vue";
import ECharts from "vue-echarts"; // 如果安装了vue-echarts
import * as echarts from "echarts";
import world from "./assets/world.json"; // 导入世界地图的GeoJSON

echarts.registerMap("world", world); // 注册世界地图

const app = createApp(App);

// 注册为全局组件（如果需要）
app.component("v-chart", ECharts);

app.mount("#app");
