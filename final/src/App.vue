<template>
  <div id="app">
    <WorldMapChart />
  </div>
</template>

<script>
import WorldMapChart from "./components/WorldMapChart.vue";

export default {
  name: "App",
  components: {
    WorldMapChart,
  },
};
</script>

<style>
/* 添加一些样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
