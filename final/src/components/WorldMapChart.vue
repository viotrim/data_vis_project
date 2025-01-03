<template>
  <div class="map-container">
    <div ref="map" class="map__content"></div>
    <div v-if="showPieChart" class="overlay">
      <div ref="pieChart" class="pie-chart"></div>
      <button class="close-btn" @click="resetMap">x</button>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import * as echarts from "echarts";
import worldMapJson from "@/assets/world.json";
import {
  worldNameMap,
  reverseWorldNameMap,
  worldGeoMap,
} from "@/assets/worldNameMap";
// const icon = require("@/assets/img/risk-icon.png");

export default {
  data() {
    return {
      worldNameMap,
      reverseWorldNameMap,
      worldGeoMap,
      showPieChart: false,
      chartDom: null,
      pieChartDom: null,
      layoutSize: "150%",
      centerCoord: [0, 0],
      markPointData: [],
      riskData: [],
    };
  },
  mounted() {
    this.initData();
  },
  computed: {
    option() {
      return {
        tooltip: {
          trigger: "item",
          backgroundColor: "#fff",
          textStyle: {
            color: "#666666",
          },
          borderWidth: 2,
          borderColor: "#ECECEE",
          padding: 10,
          formatter: function (params) {
            var value = params.value ? params.value : 0;
            return "风险个数<br/>" + params.name + " : " + value + "个";
          },
        },
        visualMap: {
          type: "piecewise",
          splitNumber: 3,
          inverse: true,
          right: 50,
          top: 50,
          pieces: [
            {
              min: 0,
              max: 100,
              color: "#dfe2f5",
            },
            {
              min: 100,
              max: 500,
              color: "#b5c1eb",
            },
            {
              min: 500,
              max: 1000,
              color: "#839aee",
            },
          ],
          textStyle: {
            color: "#6E7784",
          },
          itemWidth: 40,
          itemHeight: 10,
          align: "left",
        },
        center: this.centerCoord,
        layoutCenter: ["50%", "50%"],
        layoutSize: this.layoutSize,
        series: [
          {
            type: "map",
            map: "world",
            nameMap: this.worldNameMap,
            roam: false, //如果打开的话，在放大效果上会有bug
            itemStyle: {
              areaColor: "#dfe2f5",
              borderWidth: 0,
              emphasis: {
                label: {
                  show: false,
                },
                areaColor: "#feddb3",
              },
            },
            markPoint: {
              label: {
                normal: {
                  show: true,
                },
                emphasis: {
                  show: true,
                },
              },
              itemStyle: {
                normal: {
                  color: "rgba(72,150,128,1)",
                },
              },
              data: this.markPointData,
            },
            data: this.riskData,
          },
        ],
      };
    },
  },
  watch: {
    option: {
      handler(newOption) {
        if (this.chartDom) {
          this.chartDom.setOption(newOption);
        }
      },
      deep: true,
    },
    centerCoord(newCoord) {
      this.centerCoord = newCoord;
    },
    layoutSize(newSize) {
      this.layoutSize = newSize;
    },
  },
  methods: {
    initData() {
      echarts.registerMap("world", worldMapJson);
      this.chartDom = echarts.init(this.$refs.map);
      this.riskData = [
        { name: "中国", value: 120 },
        { name: "澳大利亚", value: 120 },
        { name: "巴西", value: 170 },
        { name: "加拿大", value: 570 },
        { name: "美国", value: 570 },
        { name: "墨西哥", value: 570 },
        { name: "古巴", value: 530 },
        { name: "西班牙", value: 70 },
      ];
      this.markPointData = [
        {
          name: "中国",
          coord: this.worldGeoMap["中国"],
          // symbol: "image://" + icon,
          symbolSize: 20,
        },
        {
          name: "澳大利亚",
          coord: this.worldGeoMap["澳大利亚"],
          // symbol: "image://" + icon,
          symbolSize: 20,
        },
        {
          name: "加拿大",
          coord: this.worldGeoMap["加拿大"],
          // symbol: "image://" + icon,
          symbolSize: 20,
        },
      ];
      this.chartDom.setOption(this.option);
      let sizeFun = () => {
        this.chartDom.resize();
      };
      window.addEventListener("resize", sizeFun);
      this.chartDom.on("click", { seriesType: "map" }, (params) => {
        const regionName = params.name;
        const translatedRegionName =
          this.reverseWorldNameMap[regionName] || regionName; // 转换区域名称
        const feature = echarts
          .getMap("world")
          .geoJson.features.find(
            (feature) => feature.properties.name === translatedRegionName
          );

        if (feature && feature.geometry) {
          // const regionCoord = this.calculateCentroid(feature.geometry); // 计算区域中心点
          // alert(
          //   `点击区域${regionName},中心点${regionCoord},地图坐标${this.worldGeoMap[regionName]}`
          // );
          const regionCoord = this.worldGeoMap[regionName];
          this.zoomToRegion(regionCoord);
        } else {
          console.error(`Region ${regionName} not found in geoJson`);
        }
      });
      onUnmounted(() => {
        window.removeEventListener("resize", sizeFun);
        if (this.chartDom) {
          echarts.dispose(this.chartDom);
        }
      });
    },
    // calculateCentroid(geometry) {
    //   let [x, y] = [0, 0];
    //   let coordinates = geometry.coordinates[0];
    //   if (geometry.type === "Polygon") {
    //     coordinates = geometry.coordinates[0];
    //   } else if (geometry.type === "MultiPolygon") {
    //     coordinates = geometry.coordinates[0][0];
    //   }
    //   coordinates.forEach((coord) => {
    //     x += coord[0];
    //     y += coord[1];
    //   });
    //   x /= coordinates.length;
    //   y /= coordinates.length;
    //   return [x, y];
    // },
    zoomToRegion(regionCoord) {
      // 放大动画
      this.centerCoord = regionCoord;
      this.layoutSize = "400%"; // 设置放大级别
      // console.log(this.option);
      this.showPieChart = true;
      this.initPieChart();
    },
    initPieChart() {
      nextTick(() => {
        this.pieChartDom = echarts.init(this.$refs.pieChart);
        let pieoption = {
          series: [
            {
              type: "pie",
              radius: "100%",
              data: [
                { value: 1048, name: "A" },
                { value: 735, name: "B" },
                { value: 580, name: "C" },
                { value: 484, name: "D" },
                { value: 300, name: "E" },
              ],
            },
          ],
        };
        this.pieChartDom.setOption(pieoption);
      });
    },
    resetMap() {
      this.showPieChart = false;
      this.centerCoord = [0, 0];
      this.layoutSize = "150%";
      if (this.pieChartDom) {
        echarts.dispose(this.pieChartDom);
        this.pieChartDom = null;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.map {
  position: relative;
  &__content {
    width: 100%;
    height: 100vh;
    margin-top: -60px;
  }
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.pie-chart {
  width: 70%;
  height: 70%;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 20px;
  background: none;
  border: none;
  font-size: 84px;
  color: rgba(0, 0, 0, 0);
  cursor: pointer;
  transition: color 0.3s ease, font-size 0.3s ease; /* 添加过渡效果 */
}
.close-btn:hover {
  color: rgba(172, 180, 224, 0.8);
}
</style>
