<template>
  <div class="map-container">
    <div
      :class="['button-container', { 'button-container-overlay': showChart }]"
    >
      <button
        :class="{ active: currentDataType === 'uploads' }"
        @click="updateDataType('uploads')"
      >
        上传数量
      </button>
      <button
        :class="{ active: currentDataType === 'subs' }"
        @click="updateDataType('subs')"
      >
        订阅人数
      </button>
      <button
        :class="{ active: currentDataType === 'videoviews' }"
        @click="updateDataType('videoviews')"
      >
        视频观看次数
      </button>
    </div>
    <div ref="map" class="map__content"></div>
    <div v-if="showChart" class="overlay">
      <div class="button-container button-container-overlay chart-type-buttons">
        <button
          :class="{ active: chartType === 'pie' }"
          @click="changeChartType('pie')"
        >
          饼图
        </button>
        <button
          :class="{ active: chartType === 'bar' }"
          @click="changeChartType('bar')"
        >
          柱状图
        </button>
      </div>
      <div ref="chart" :class="chartClass"></div>
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
import {
  totaldata,
  markPointData,
  detailData,
  detailedCountry,
  thumbnailData,
} from "@/assets/youtubeData";

export default {
  data() {
    return {
      worldNameMap,
      reverseWorldNameMap,
      worldGeoMap,
      totaldata,
      markPointData,
      detailData,
      detailedCountry,
      thumbnailData,
      showChart: false,
      chartType: "pie",
      chartDom: null,
      pieChartDom: null,
      barChartDom: null,
      currentRegion: null,
      layoutSize: "150%",
      centerCoord: [0, 0],
      currentDataType: "uploads", // 当前展示的数据类型
      chartClass: "pie-chart",
    };
  },
  mounted() {
    this.initData();
  },
  computed: {
    option() {
      const dataType = this.currentDataType;
      const dataValues = this.totaldata.map((item) => item[dataType]);
      const min = Math.min(...dataValues);
      const max = Math.max(...dataValues);
      return {
        tooltip: {
          trigger: "item",
          backgroundColor: "#dfe2f5",
          textStyle: {
            color: "#666666",
          },
          borderWidth: 2,
          borderColor: "#ECECEE",
          padding: 10,
          formatter: function (params) {
            var uploads = params.data.uploads ? params.data.uploads : 0;
            var subs = params.data.subs ? params.data.subs : 0;
            var vedioviews = params.data.videoviews
              ? params.data.videoviews
              : 0;
            return `<div style="text-align: left;">
    <strong>${params.name}</strong> : <br/>
    <span>上传数量: ${uploads} 次</span><br/>
    <span>订阅人数: ${subs} 人</span><br/>
    <span>视频观看次数: ${vedioviews} 次</span>
  </div>`;
          },
        },
        visualMap: {
          type: "continuous",
          min: min,
          max: max,
          right: 50,
          top: 50,
          inRange: {
            color: [
              "#ccffcc", // 浅绿
              "#99ff99", // 稍深一点的绿
              "#66ff66", // 再深一点的绿
              "#33ff33", // 更接近原始的绿色
              "#00ff00", // 原始的绿色
              "#4c004c", // 向紫色过渡
              "#800080", // 紫色
            ],
          },
          textStyle: {
            color: "#6E7784",
          },
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
            data: this.totaldata.map((item) => ({
              name: item.name,
              value: item[dataType], // 根据 currentDataType 设置 value
              uploads: item.uploads,
              subs: item.subs,
              videoviews: item.videoviews,
            })),
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
    currentDataType(newType) {
      // this.currentDataType = newType;
      if (this.showChart && this.currentRegion) {
        this.initChart(this.currentRegion);
      }
    },
    chartType(newType) {
      // this.chartType = newType;
      this.chartClass = newType === "pie" ? "pie-chart" : "bar-chart";
      if (this.showChart && this.currentRegion) {
        this.initChart(this.currentRegion);
      }
    },
  },
  methods: {
    updateDataType(type) {
      this.currentDataType = type;
      // this.initData(); // 更新图表数据
    },
    changeChartType(type) {
      this.chartType = type;
    },
    initData() {
      echarts.registerMap("world", worldMapJson);
      this.chartDom = echarts.init(this.$refs.map);
      this.chartDom.setOption(this.option);
      let sizeFun = () => {
        this.chartDom.resize();
      };
      window.addEventListener("resize", sizeFun);
      this.chartDom.on("click", { seriesType: "map" }, (params) => {
        const regionName = params.name;
        // 检查 regionName 是否在 detailedCountry 中
        if (!this.detailedCountry.includes(regionName)) {
          return;
        }
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
          this.zoomToRegion(regionCoord, regionName);
        } else {
          console.error(`Region ${regionName} not found in geoJson`);
        }
      });
      // onUnmounted(() => {
      //   window.removeEventListener("resize", sizeFun);
      //   if (this.chartDom) {
      //     echarts.dispose(this.chartDom);
      //   }
      // });
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
    zoomToRegion(regionCoord, regionName) {
      // 放大动画
      this.centerCoord = regionCoord;
      this.layoutSize = "400%"; // 设置放大级别
      // console.log(this.option);
      this.showChart = true;
      this.currentRegion = regionName;
      this.initChart(regionName);
    },
    initChart(regionName) {
      switch (this.chartType) {
        case "pie":
          this.initPieChart(regionName);
          break;
        case "bar":
          this.initBarChart(regionName);
          break;
        default:
          console.warn(`Unknown chart type: ${this.chartType}`);
      }
    },
    initPieChart(regionName) {
      nextTick(() => {
        this.pieChartDom = echarts.init(this.$refs.chart);
        const pieData = this.detailData[regionName].map((item) => ({
          name: item.name,
          value: item[this.currentDataType],
          thumbnailAddr: this.thumbnailData[regionName][item.id],
        }));
        let pieoption = {
          // 初始化渲染的动画配置
          animation: true,
          animationDuration: 1000, // 初始渲染动画持续时间 (毫秒)
          animationEasing: "circularInOut", // 初始渲染动画缓动函数

          // 更新时的动画配置
          animationDurationUpdate: 3000, // 更新动画持续时间 (毫秒)，这里设置为2秒
          animationEasingUpdate: "circularInOut", // 更新动画缓动函数
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              const { name, value, data } = params;
              const thumbnail = data.thumbnailAddr
                ? `<img src="${data.thumbnailAddr}" style="width:50px;height:50px;"/><br/>`
                : "";
              return `${thumbnail}<strong>${name}</strong>: ${value}`;
            },
          },
          series: [
            {
              type: "pie",
              radius: "80%",
              data: pieData,
            },
          ],
        };
        this.pieChartDom.setOption(pieoption);
      });
    },
    initBarChart(regionName) {
      nextTick(() => {
        this.barChartDom = echarts.init(this.$refs.chart);
        const barData = this.detailData[regionName].map((item) => ({
          name: item.name,
          value: item[this.currentDataType],
          thumbnailAddr: this.thumbnailData[regionName][item.id],
        }));
        let baroption = {
          // 初始化渲染的动画配置
          animation: true,
          animationDuration: 1000, // 初始渲染动画持续时间 (毫秒)
          animationEasing: "cubicInOut", // 初始渲染动画缓动函数

          // 更新时的动画配置
          animationDurationUpdate: 2000, // 更新动画持续时间 (毫秒)，这里设置为2秒
          animationEasingUpdate: "cubicInOut", // 更新动画缓动函数
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              const { name, value, data } = params;
              const thumbnail = data.thumbnailAddr
                ? `<img src="${data.thumbnailAddr}" style="width:50px;height:50px;"/><br/>`
                : "";
              return `${thumbnail}<strong>${name}</strong>: ${value}`;
            },
          },
          color: ["#3398DB"],
          yAxis: {
            type: "category",
            axisPointer: {
              show: false, //默认不显示
              type: "shadow", //'line'直线指示器 'shadow'阴影指示器 'none'无
            },
            axisLine: {
              show: false, //是否显示y轴，默认显示
            },
            axisLabel: {
              show: true, //是否显示
              color: "#333", //文字颜色
              // interval: 0, //间隔显示个数
              // rotate: 0, //刻度标签旋转的角度，值>0向左倾斜，值<0则向右倾斜，旋转的角度从 -90 度到 90 度。
            },
            data: barData.map((item) => item.name),
          },
          xAxis: {
            type: "value",
            axisPointer: {
              show: false, //默认不显示
              type: "shadow", //'line'直线指示器 'shadow'阴影指示器 'none'无
            },
            // axisLine: {
            //   show: true, // 显示X轴
            //   lineStyle: {
            //     color: "#ccc", // X轴颜色
            //   },
            // },
            axisLabel: {
              show: true, // 显示标签
              color: "#333", // 标签颜色
            },
            splitLine: {
              show: true, // 显示网格线
              lineStyle: {
                color: "rgba(255, 255, 255, 0.05)", // 网格线颜色
              },
              // interval: 15, // 网格线间隔
            },
          },
          series: [
            {
              type: "bar",
              data: barData,
            },
          ],
        };
        this.barChartDom.setOption(baroption);
      });
    },
    resetMap() {
      this.showChart = false;
      this.centerCoord = [0, 0];
      this.layoutSize = "150%";
      this.currentRegion = null;
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
    margin-top: -20px;
  }
}
.button-container-overlay {
  opacity: 0.7; /* 颜色变淡 */
}
.button-container {
  position: absolute;
  display: flex;
  justify-content: left;
  font-size: 12px;
  z-index: 1000;
  left: 180px;
  // margin-bottom: 10px;
}
.button-container button {
  margin: 0 5px;
  padding: 5px 10px;
  background-color: #b5c1eb; /* 按钮背景颜色 */
  color: rgb(255, 255, 255); /* 按钮文字颜色 */
  border: none;
  border-radius: 30px; /* 圆形边框 */
  cursor: pointer;
  transition: background-color 0.3s ease; /* 背景颜色过渡效果 */
  font-size: 10px;
}
.button-container button.active {
  background-color: #839aee; /* 选中时的背景颜色 */
}
.button-container button:hover {
  background-color: #dfe2f5; /* 悬停时的背景颜色 */
}
.chart-type-buttons {
  position: absolute;
  top: 80px;
  left: 220px;
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
  z-index: 500;
}
.pie-chart {
  width: 100%;
  height: 100%;
}
.bar-chart {
  width: 100%;
  height: 100%;
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
